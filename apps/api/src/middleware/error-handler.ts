import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { isRecordNotFound, isUniqueViolation } from '../utils/prisma-errors';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
};

/** body-parser errors carry `type` and `status` (e.g. malformed JSON, payload too large). */
function isHttpParserError(err: unknown): err is { status: number; type: string; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  );
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten() },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (isUniqueViolation(err)) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
    return;
  }

  if (isRecordNotFound(err)) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    return;
  }

  if (isHttpParserError(err) && err.status < 500) {
    res.status(err.status).json({ error: { code: 'BAD_REQUEST', message: err.message } });
    return;
  }

  req.log.error({ err }, 'unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error', requestId: String(req.id) },
  });
};
