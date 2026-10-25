import { loginSchema, registerSchema } from '@taskflow/shared';
import { Router } from 'express';
import { getUserId, requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rate-limit';
import { AppError } from '../../utils/app-error';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from './auth.cookies';
import * as authService from './auth.service';

export const authRouter = Router();

// Brute-force protection for credential endpoints.
const credentialsLimiter = createRateLimiter({ prefix: 'auth', windowMs: 15 * 60_000, limit: 20 });

authRouter.post('/register', credentialsLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const { user, tokens } = await authService.register(input);
  setAuthCookies(res, tokens);
  res.status(201).json({ user });
});

authRouter.post('/login', credentialsLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { user, tokens } = await authService.login(input);
  setAuthCookies(res, tokens);
  res.json({ user });
});

authRouter.post('/refresh', async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  try {
    if (typeof token !== 'string') throw AppError.unauthorized('Missing refresh token');
    setAuthCookies(res, await authService.refresh(token));
  } catch (err) {
    // Clearing cookies stops the web middleware from bouncing the user back into the app.
    clearAuthCookies(res);
    throw err;
  }
  res.status(204).end();
});

authRouter.post('/logout', async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(typeof token === 'string' ? token : undefined);
  clearAuthCookies(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.getMe(getUserId(req)) });
});
