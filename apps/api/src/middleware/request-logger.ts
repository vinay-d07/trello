import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger';

const REQUEST_ID_HEADER = 'x-request-id';

export const requestLogger = pinoHttp({
  logger,
  // Propagate an upstream request id (from a proxy / another service) or mint one.
  genReqId: (req, res) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === 'string' && incoming.length <= 128 ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
});
