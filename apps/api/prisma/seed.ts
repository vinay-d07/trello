/**
 * Seeds two users, one shared project and a configurable number of tasks.
 *   npm run db:seed                 -> 200 tasks
 *   SEED_TASKS=50000 npm run db:seed -> big dataset for performance days
 */
import { PrismaClient, type TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const TASK_COUNT = Number(process.env.SEED_TASKS ?? 200);
const BATCH_SIZE = 1000;
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', passwordHash },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', passwordHash },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Launch v1',
      description: 'Seeded demo project',
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  for (let offset = 0; offset < TASK_COUNT; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TASK_COUNT - offset);
    await prisma.task.createMany({
      data: Array.from({ length: size }, (_, i) => {
        const n = offset + i;
        return {
          projectId: project.id,
          title: `Task #${n + 1}`,
          description: n % 3 === 0 ? `Details for task ${n + 1}` : null,
          status: STATUSES[n % STATUSES.length],
          priority: n % 4,
          assigneeId: n % 2 === 0 ? alice.id : bob.id,
          createdById: alice.id,
        };
      }),
    });
  }

  const someTasks = await prisma.task.findMany({
    where: { projectId: project.id },
    take: 20,
    select: { id: true },
  });
  await prisma.comment.createMany({
    data: someTasks.flatMap((task, i) => [
      { taskId: task.id, authorId: alice.id, body: `First comment on task ${i + 1}` },
      { taskId: task.id, authorId: bob.id, body: `Reply from Bob on task ${i + 1}` },
    ]),
  });

  console.warn(`Seeded project "${project.name}" with ${TASK_COUNT} tasks.`);
  console.warn('Login: alice@example.com / password123 (or bob@example.com)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
