import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { getSocketConnection, SOCKET_EVENTS } from '@shared/src/api';

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback?: (data: unknown) => void) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const sock = getSocketConnection();
    setSocket(sock);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = () => setIsConnected(false);

    sock.on(SOCKET_EVENTS.CONNECT, onConnect);
    sock.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    sock.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
    setIsConnected(sock.connected);

    return () => {
      sock.off(SOCKET_EVENTS.CONNECT, onConnect);
      sock.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      sock.off(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    const sock = typeof window === 'undefined' ? null : getSocketConnection();
    sock?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    const sock = typeof window === 'undefined' ? null : getSocketConnection();
    sock?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (data: unknown) => void) => {
    const sock = typeof window === 'undefined' ? null : getSocketConnection();
    if (!sock) return;
    if (callback) sock.off(event, callback);
    else sock.off(event);
  }, []);

  const value: RealtimeContextType = useMemo(
    () => ({
      socket,
      isConnected,
      emit,
      on,
      off,
    }),
    [socket, isConnected, emit, on, off],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
