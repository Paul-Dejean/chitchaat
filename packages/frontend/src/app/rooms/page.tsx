import { VideoBoard } from "@/components/VideoBoard";
import { RoomProvider } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useSearchParams } from "react-router";

import useSWR from "swr";

export default function RoomPage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");

  const { data: room } = useSWR(roomId, getRoomById);

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <RoomProvider roomId={room.id}>
      <div className="mx-2 h-screen max-h-dvh flex flex-col justify-start bg-background">
        <div className="mb-8 h-full">{room && <VideoBoard></VideoBoard>}</div>
      </div>
    </RoomProvider>
  );
}
