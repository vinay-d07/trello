import { Emitter } from '@socket.io/redis-emitter';
import { rooms, type ServerToClientEvents } from '@taskflow/shared';
import { createRedis } from '../lib/redis';

/**
 * Publishes socket events through Redis instead of a local `io` instance, so
 * any process (any API replica, the queue worker, a cron job) can push to
 * clients connected to any other replica.
 */
let emitter: Emitter<ServerToClientEvents> | undefined;

function getEmitter(): Emitter<ServerToClientEvents> {
  emitter ??= new Emitter<ServerToClientEvents>(createRedis('socket-emitter'));
  return emitter;
}

type EventName = keyof ServerToClientEvents;
type EventArgs<E extends EventName> = Parameters<ServerToClientEvents[E]>;

export function emitToProject<E extends EventName>(
  projectId: string,
  event: E,
  ...args: EventArgs<E>
): void {
  getEmitter()
    .to(rooms.project(projectId))
    .emit(event, ...args);
}

export function emitToUser<E extends EventName>(
  userId: string,
  event: E,
  ...args: EventArgs<E>
): void {
  getEmitter()
    .to(rooms.user(userId))
    .emit(event, ...args);
}
