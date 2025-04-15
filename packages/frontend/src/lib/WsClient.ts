import { io, Socket } from "socket.io-client";

type EventListener<T extends unknown[]> =
  | ((...args: T) => void)
  | ((...args: T) => Promise<void>);

type SocketResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
export class WsClient {
  private socketUrl: string;
  private socket: Socket | undefined;
  private connected: boolean = false;

  constructor(socketUrl: string) {
    this.socketUrl = socketUrl;
  }

  registerHandler<T extends unknown[]>(
    event: string,
    handler: EventListener<T>
  ) {
    if (!this.socket) {
      throw new Error("Socket not instanciated");
    }
    this.socket.on(event, handler);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.socketUrl);

      this.socket.on("connect_error", (error) => {
        reject(error);
      });

      this.socket.on("connect", () => {
        this.connected = true;
        resolve();
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
      });
    });
  }

  get isConnected() {
    return this.connected;
  }

  get id() {
    return this.socket?.id;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  async emitMessage<T = unknown>(type: string, data = {}): Promise<T> {
    if (!this.isConnected) throw new Error("Socket is not connected");
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        throw new Error("Socket not instanciated");
      }

      this.socket.emit(type, data, (response: SocketResponse<T>) => {
        if (!response.success) {
          reject(response.error);
        } else {
          resolve(response.data);
        }
      });
    });
  }
}
