"use client";
import { RoomClient } from "@/lib/roomClient";
import { createContext } from "react";

const roomClient = new RoomClient();

export const RoomContext = createContext<RoomClient>(roomClient);
type RoomProviderProps = {
  children: React.ReactNode; // Defining the type for children prop
};

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  return (
    <RoomContext.Provider value={roomClient}>{children}</RoomContext.Provider>
  );
};
