import type { ClientToServerEvents, ServerToClientEvents } from '@taskflow/shared';
import { io, type Socket } from 'socket.io-client';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * One shared connection per tab. Websocket-only transport means no HTTP
 * long-polling fallback, so multiple API replicas don't need sticky sessions.
 */
export function getSocket(): AppSocket {
  socket ??= io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', {
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: false,
  });
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
