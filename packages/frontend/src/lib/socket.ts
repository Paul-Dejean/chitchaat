import { Socket, io } from "socket.io-client";
let socket: Socket;
export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL);

    socket.on("connect", () => {
      console.log("Connected to the server!");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from the server!");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
  }
  return socket;
}
