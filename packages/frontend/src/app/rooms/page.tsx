import { MeetingBoard } from "@/components/MeetingBoard";
import { WaitingRoom } from "@/components/WaitingRoom";
import { RoomProvider, useRoomClient } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useState } from "react";
import { Toaster, resolveValue } from "react-hot-toast";
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
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-4 py-12 text-center">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Room Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                {
                  "The room you're trying to join doesn't exist or has been removed."
                }
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 px-4 bg-primary text-white font-medium rounded-lg shadow-sm transition-all hover:bg-green-dark"
              >
                Return to Home
              </button>
            </div>
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
        {!isLoading && !error && hasJoined && <MeetingBoard />}
      </div>
    </RoomProvider>
  );
}
