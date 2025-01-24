"use client";

import { VideoBoard } from "@/components/VideoBoard";
import { RoomProvider } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useSelector } from "@/store";
import { useSearchParams } from "next/navigation";
import { BiLogoBaidu } from "react-icons/bi";
import useSWR from "swr";

export default function RoomPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") as string;

  const room = useSWR(roomId, getRoomById).data;

  const peers = useSelector((state) => state.room.peers);

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <RoomProvider roomId={room.id}>
      <div className="mx-8 h-screen flex flex-col justify-start">
        <div className="pt-4 flex gap-x-4 items-center">
          <div className="flex justify-between">
            <BiLogoBaidu
              className="text-primary bg-gray-800 rounded-full p-1"
              size={40}
            />
          </div>
          <div>
            <h1 className="text-white font-bold">
              Business weekly meeting {room?.id}
            </h1>
            {/* <p className="text-secondary text-sm">{`${today.toLocaleDateString()} ${today.toLocaleTimeString()}`}</p> */}
          </div>
          <div>
            <span className="text-white">
              Number of peers in the room {Object.keys(peers).length}
            </span>
          </div>
        </div>
        <div className="mb-8 flex-1">{room && <VideoBoard></VideoBoard>}</div>
      </div>
    </RoomProvider>
  );
}
