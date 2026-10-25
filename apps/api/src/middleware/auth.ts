import type { Request, RequestHandler } from 'express';
import { ACCESS_COOKIE } from '../modules/auth/auth.cookies';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { AppError } from '../utils/app-error';

/** Accepts the httpOnly cookie (browser) or a Bearer token (scripts, other services). */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  const cookie: unknown = req.cookies?.[ACCESS_COOKIE];
  const token = bearer ?? (typeof cookie === 'string' ? cookie : undefined);

  if (!token) throw AppError.unauthorized();
  req.user = { id: verifyAccessToken(token) };
  next();
};

export function getUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}
