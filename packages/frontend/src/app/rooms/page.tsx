"use client";

import { VideoBoard } from "@/components/VideoBoard";
import { RoomProvider } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useSearchParams } from "next/navigation";

import useSWR from "swr";

export default function RoomPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") as string;

  const room = useSWR(roomId, getRoomById).data;

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <RoomProvider roomId={room.id}>
      <div className="mx-2 h-screen max-h-screen flex flex-col justify-start">
        <div className="mb-8 h-full">{room && <VideoBoard></VideoBoard>}</div>
      </div>
    </RoomProvider>
  );
}
