import { RoomClient } from "@/lib/RoomClient";
import { createContext, useContext } from "react";
import { store } from "@/store";

const roomClient = new RoomClient({ store });

export const RoomContext = createContext<RoomClient>(roomClient);
type RoomProviderProps = {
  children: React.ReactNode;
  roomId: string;
};

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  return (
    <RoomContext.Provider value={roomClient}>{children}</RoomContext.Provider>
  );
};

export function useRoomClient() {
  return useContext(RoomContext);
}
