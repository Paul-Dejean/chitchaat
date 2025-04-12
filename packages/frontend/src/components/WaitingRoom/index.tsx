import { Button } from "@/ui-library/Button";
import { IconButton } from "@/ui-library/IconButton";
import { TextInput } from "@/ui-library/TextInput";

import { useRoomClient } from "@/contexts/RoomContext";
import { useSelector } from "@/store";
import { useState } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoVideocamOffOutline, IoVideocamOutline } from "react-icons/io5";
import { StreamPlayer } from "../StreamPlayer";

export function WaitingRoom({
  onJoinRoom,
}: {
  onJoinRoom: (settings: {
    userName: string;
    isMicOn: boolean;
    isCameraOn: boolean;
  }) => void;
}) {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [userName, setUserName] = useState<string>("");
  const roomClient = useRoomClient();
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );

  const isCameraEnabled = useSelector((state) => state.room.isCameraEnabled);

  const toggleCamera = async () => {
    if (!isCameraEnabled) {
      const stream = await roomClient.enableWebcam({ produce: false });
      setVideoStream(stream);
    } else {
      await roomClient.disableWebcam();
      setVideoStream(null);
    }
  };

  const toggleMic = () => {
    if (!isMicrophoneEnabled) {
      roomClient.enableMicrophone({ produce: false });
    } else {
      roomClient.disableMicrophone();
    }
  };

  const handleJoinRoom = () => {
    if (!userName) return;
    onJoinRoom({
      userName,
      isMicOn: isMicrophoneEnabled,
      isCameraOn: isCameraEnabled,
    });
  };

  console.log("waiting");

  return (
    <div className="flex flex-col items-center  w-full p-8">
      <h2 className="text-3xl font-semibold mb-8">Waiting Room</h2>
      <div className="relative w-full max-w-2xl h-96 bg-black rounded-lg overflow-hidden mb-4">
        <StreamPlayer
          audioTrack={null} // Replace with actual audio track
          videoTrack={videoStream?.getTracks()?.[0] ?? null} // Replace with actual video track
          displayName={"You"}
          isAudioEnabled={isMicrophoneEnabled}
        />
      </div>

      <div className="flex gap-4 mb-12 w-full max-w-2xl justify-center">
        <IconButton
          icon={
            isMicrophoneEnabled ? (
              <BiMicrophone size={22} />
            ) : (
              <BiMicrophoneOff size={22} />
            )
          }
          aria-label="Toggle Microphone"
          variant={isMicrophoneEnabled ? "primary" : "danger"}
          onClick={() => {
            toggleMic();
          }}
          className="hover:scale-105 transition-transform duration-200"
        />
        <IconButton
          icon={
            isCameraEnabled ? (
              <IoVideocamOutline size={22} />
            ) : (
              <IoVideocamOffOutline size={22} />
            )
          }
          aria-label="Toggle Video"
          variant={isCameraEnabled ? "primary" : "danger"}
          onClick={() => {
            toggleCamera();
          }}
          className="hover:scale-105 transition-transform duration-200"
        />
      </div>

      <div className="mb-6 w-full max-w-md">
        <TextInput
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full py-3 px-4 text-base rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
        />
      </div>

      <Button variant="primary" onClick={handleJoinRoom} disabled={!userName}>
        Join Room
      </Button>
    </div>
  );
}
