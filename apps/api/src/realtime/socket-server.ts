import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  rooms,
  SocketEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@taskflow/shared';
import { parse as parseCookie } from 'cookie';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { createRedis, trackRedis } from '../lib/redis';
import { ACCESS_COOKIE } from '../modules/auth/auth.cookies';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { assertMember } from '../modules/projects/project.service';
import { AppError } from '../utils/app-error';

interface SocketData {
  userId: string;
}

export type IOServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer): IOServer {
  // The redis adapter fans events out across every API replica.
  const pubClient = createRedis('socket-pub');
  const subClient = trackRedis(pubClient.duplicate(), 'socket-sub');

  const io: IOServer = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    adapter: createAdapter(pubClient, subClient),
    serveClient: false,
  });

  // Authenticate the handshake with the same access token the REST API uses.
  io.use((socket, next) => {
    try {
      const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
      const authToken: unknown = socket.handshake.auth?.token;
      const token = typeof authToken === 'string' ? authToken : cookies[ACCESS_COOKIE];
      if (!token) throw AppError.unauthorized();
      socket.data.userId = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    void socket.join(rooms.user(userId));

    socket.on(SocketEvents.PROJECT_JOIN, async (projectId, ack) => {
      try {
        if (typeof projectId !== 'string') throw AppError.badRequest('Invalid project id');
        // Never let a client subscribe to a room it isn't authorised for.
        await assertMember(projectId, userId);
        await socket.join(rooms.project(projectId));
        ack?.({ ok: true });
      } catch (err) {
        if (!(err instanceof AppError))
          logger.error({ err, userId, projectId }, 'project join failed');
        ack?.({
          ok: false,
          error: err instanceof AppError ? err.message : 'Could not join project',
        });
      }
    });

    socket.on(SocketEvents.PROJECT_LEAVE, (projectId) => {
      if (typeof projectId === 'string') void socket.leave(rooms.project(projectId));
    });
  });

  return io;
}
