declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth. Use getUserId(req) instead of reading this directly. */
      user?: { id: string };
    }
  }
}

export {};
