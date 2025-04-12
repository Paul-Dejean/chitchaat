import { VideoBoard } from "@/components/VideoBoard";
import { WaitingRoom } from "@/components/WaitingRoom";
import { RoomProvider, useRoomClient } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";

import useSWR from "swr";

export default function RoomPage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const navigate = useNavigate();
  const roomClient = useRoomClient();

  const [hasJoined, setHasJoined] = useState(false);

  const { data: room, isLoading, error } = useSWR(roomId, getRoomById);

  if (!roomId) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Error</h1>
        <p>Room ID is required</p>
        <button onClick={() => navigate("/")}>Go back</button>
      </div>
    );
  }

  const hasError = !isLoading && (error || !room);

  return (
    <RoomProvider roomId={roomId}>
      <div className="h-screen max-h-dvh flex flex-col justify-start bg-green">
        {isLoading && <div>Loading...</div>}

        {hasError && (
          <div>
            <h1 className="text-3xl font-bold">This room does not exist</h1>
            <p>{error.message}</p>
            <button onClick={() => navigate("/")}>Go back</button>
          </div>
        )}

        {!isLoading && !error && !hasJoined && (
          <WaitingRoom
            onJoinRoom={async ({ userName, isCameraOn, isMicOn }) => {
              await roomClient.joinRoom(roomId, userName);
              console.log({ userName, isCameraOn, isMicOn });
              if (isCameraOn) {
                await roomClient.enableWebcam();
              }
              if (isMicOn) {
                await roomClient.enableMicrophone();
              }
              setHasJoined(true);
            }}
          />
        )}

        {!isLoading && !error && hasJoined && <VideoBoard />}
      </div>
    </RoomProvider>
  );
}
