"use client";
import { RoomClient } from "@/lib/roomClient";
import { createContext, useContext, useEffect } from "react";
import { store } from "@/store";

const roomClient = new RoomClient({ store });

export const RoomContext = createContext<RoomClient>(roomClient);
type RoomProviderProps = {
  children: React.ReactNode;
  roomId: string;
};

export const RoomProvider: React.FC<RoomProviderProps> = ({
  children,
  roomId,
}) => {
  useEffect(() => {
    console.log("joining room");
    roomClient.joinRoom(roomId);
    return () => {
      console.log("leaving room");
      roomClient.leaveRoom();
    };
  }, [roomId]);
  return (
    <RoomContext.Provider value={roomClient}>{children}</RoomContext.Provider>
  );
};

export function useRoomClient() {
  return useContext(RoomContext);
}
