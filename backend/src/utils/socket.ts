import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setSocketServer = (server: SocketIOServer) => {
  io = server;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
};
