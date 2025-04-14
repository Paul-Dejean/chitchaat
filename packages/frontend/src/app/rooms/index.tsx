import { MeetingBoard } from "@/components/MeetingBoard";
import { WaitingRoom } from "@/components/WaitingRoom";
import { RoomProvider, useRoomClient } from "@/contexts/RoomContext";
import { getRoomById } from "@/services/rooms";
import { useState } from "react";
import { Toaster, resolveValue } from "react-hot-toast";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";
import { FullScreenLoading } from "@/components/LoadingSpinner";

import useSWR from "swr";
import { WarningIcon } from "@/components/WarningIcon";

export function RoomPage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId");
  const navigate = useNavigate();
  const roomClient = useRoomClient();

  const [hasJoined, setHasJoined] = useState(false);

  const { data: room, isLoading, error } = useSWR(roomId, getRoomById);

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center fixed inset-0 px-4 py-12 text-center">
        <div className="bg-surface-2 shadow-xl rounded-2xl p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full  flex items-center justify-center">
            <WarningIcon className="h-10 w-10 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-base mb-2">Room ID Missing</h1>
          <p className="text-gray-600 mb-6">
            A valid Room ID is required to join a meeting.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 px-4 bg-primary text-white font-medium rounded-lg shadow-sm transition-all hover:bg-primary-dark"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const hasError = !isLoading && (error || !room);

  return (
    <RoomProvider roomId={roomId}>
      <div className="h-screen max-h-dvh flex flex-col justify-start">
        <Toaster
          position="top-right"
          gutter={8}
          reverseOrder={true}
          toastOptions={{ duration: 2000 }}
        >
          {(t) => (
            <div className="bg-info text-base flex  mt-14 gap-x-2 px-2 py-2 rounded-lg max-w-[200px] overflow-hidden">
              <span>💬</span>
              <span className="line-clamp-3">{resolveValue(t.message, t)}</span>
            </div>
          )}
        </Toaster>
        {isLoading && <FullScreenLoading />}
        {hasError && (
          <div className="flex flex-col items-center justify-center fixed inset-0  px-4 py-12 text-center">
            <div className="bg-surface-2 shadow-xl rounded-2xl p-8 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger-light flex items-center justify-center">
                <WarningIcon className="h-10 w-10 text-danger" />
              </div>
              <h1 className="text-2xl font-bold text-base mb-2">
                Room Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                {
                  "The room you're trying to join doesn't exist or has been removed."
                }
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 px-4 bg-primary text-white font-medium rounded-lg shadow-sm transition-all hover:bg-primary-dark"
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
