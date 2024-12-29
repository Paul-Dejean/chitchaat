"use client";

import { getRoomById } from "@/services/rooms";
import { BiLogoBaidu } from "react-icons/bi";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { VideoBoard } from "@/components/VideoBoard";

export default function RoomPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") as string;

  const room = useSWR(roomId, getRoomById).data;
  console.log({ room });
  return (
    <div className="mx-8">
      <div className="pt-4 flex gap-x-4 items-center">
        <div>
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
      </div>
      {room && <VideoBoard room={room}></VideoBoard>}
    </div>
  );
}
