import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { LoginInput, RegisterInput, UserDTO } from '@taskflow/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { isUniqueViolation } from '../../utils/prisma-errors';

const BCRYPT_ROUNDS = 12;
const DAY_MS = 86_400_000;
// Compared against when the email doesn't exist so response time doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', BCRYPT_ROUNDS);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const toUserDTO = (user: { id: string; email: string; name: string }): UserDTO => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
}

/** Returns the user id or throws a 401. */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof payload === 'string' || !payload.sub) throw new Error('malformed token');
    return payload.sub;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

async function issueTokens(
  userId: string,
  db: Prisma.TransactionClient = prisma,
): Promise<AuthTokens> {
  const refreshToken = randomBytes(32).toString('base64url');
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    },
  });
  return { accessToken: signAccessToken(userId), refreshToken };
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });
    return { user: toUserDTO(user), tokens: await issueTokens(user.id) };
  } catch (err) {
    if (isUniqueViolation(err))
      throw AppError.conflict('An account with this email already exists');
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) throw AppError.unauthorized('Invalid email or password');
  return { user: toUserDTO(user), tokens: await issueTokens(user.id) };
}

/**
 * Rotates the refresh token. Presenting an already-rotated token means it was
 * stolen (or replayed), so every session for that user is revoked.
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!existing) throw AppError.unauthorized('Invalid refresh token');

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthorized('Refresh token reuse detected');
  }

  if (existing.expiresAt <= new Date()) throw AppError.unauthorized('Refresh token expired');

  return prisma.$transaction(async (tx) => {
    // Conditional update makes the rotation atomic if two requests race.
    const { count } = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw AppError.unauthorized('Invalid refresh token');
    return issueTokens(existing.userId, tx);
  });
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string): Promise<UserDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw AppError.unauthorized();
  return user;
}
