import type { CookieOptions, Response } from 'express';
import { env, isProd } from '../../config/env';
import type { AuthTokens } from './auth.service';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
// The refresh token is only ever sent to the auth endpoints.
const REFRESH_COOKIE_PATH = '/api/auth';

const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  domain: env.COOKIE_DOMAIN,
};

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  const sessionMaxAge = env.REFRESH_TOKEN_TTL_DAYS * 86_400_000;
  // The access cookie intentionally outlives the JWT inside it: an expired JWT
  // still tells the Next.js middleware "there is a session", and the client then
  // calls /auth/refresh on the first 401.
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookie,
    path: '/',
    maxAge: sessionMaxAge,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie,
    path: REFRESH_COOKIE_PATH,
    maxAge: sessionMaxAge,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, path: REFRESH_COOKIE_PATH });
}
