import type { ProjectRole } from '@prisma/client';
import type {
  AddMemberInput,
  CreateProjectInput,
  ProjectDetailDTO,
  ProjectMemberDTO,
  ProjectSummaryDTO,
} from '@taskflow/shared';
import { cacheKeys, getOrSet, invalidate } from '../../lib/cache';
import { prisma } from '../../lib/prisma';
import { enqueueNotification } from '../../queues/notification.queue';
import { AppError } from '../../utils/app-error';
import { isUniqueViolation } from '../../utils/prisma-errors';

const PROJECT_LIST_TTL_SECONDS = 60;
export const MANAGER_ROLES: readonly ProjectRole[] = ['OWNER', 'ADMIN'];

/**
 * Authorisation gate for everything under a project. Responds 404 rather than
 * 403 for non-members so project ids can't be probed.
 */
export async function assertMember(
  projectId: string,
  userId: string,
  allowedRoles?: readonly ProjectRole[],
) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw AppError.notFound('Project not found');
  if (allowedRoles && !allowedRoles.includes(membership.role)) throw AppError.forbidden();
  return membership;
}

export async function listForUser(userId: string): Promise<ProjectSummaryDTO[]> {
  return getOrSet(cacheKeys.userProjects(userId), PROJECT_LIST_TTL_SECONDS, async () => {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            _count: { select: { members: true } },
          },
        },
      },
    });
    return memberships.map(({ role, project }) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      role,
      memberCount: project._count.members,
      createdAt: project.createdAt.toISOString(),
    }));
  });
}

export async function create(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectSummaryDTO> {
  // Nested write: project + owner membership in one transaction.
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      members: { create: { userId, role: 'OWNER' } },
    },
  });
  await invalidate(cacheKeys.userProjects(userId));
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    role: 'OWNER',
    memberCount: 1,
    createdAt: project.createdAt.toISOString(),
  };
}

export async function getById(projectId: string, userId: string): Promise<ProjectDetailDTO> {
  await assertMember(projectId, userId);
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
        select: { role: true, user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    members: project.members,
  };
}

export async function addMember(
  projectId: string,
  actorId: string,
  input: AddMemberInput,
): Promise<ProjectMemberDTO> {
  await assertMember(projectId, actorId, MANAGER_ROLES);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw AppError.notFound('No user with that email');

  let membership;
  try {
    membership = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role: input.role },
      select: { role: true, project: { select: { name: true } } },
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw AppError.conflict('User is already a member');
    throw err;
  }

  // memberCount changed for everyone in the project.
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  await invalidate(...members.map((m) => cacheKeys.userProjects(m.userId)));

  await enqueueNotification(
    {
      userId: user.id,
      type: 'project.member_added',
      payload: { projectId, projectName: membership.project.name, addedById: actorId },
    },
    `member-added-${projectId}-${user.id}`,
  );

  return { role: membership.role, user };
}
