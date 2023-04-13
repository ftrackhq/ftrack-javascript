export function connect(serverUrl: string, options: any): SocketIO;

// interface for socketio
export interface SocketIO {
  on(event: string, callback: (data: any) => unknown): void;
  emit(event: string, data: any): void;
  socket: {
    connected: boolean;
    reconnect(): void;
  };
}
