import { Button } from "@/ui-library/Button";
import { IconButton } from "@/ui-library/IconButton";
import { TextInput } from "@/ui-library/TextInput";

import { useRoomClient } from "@/contexts/RoomContext";
import { useSelector } from "@/store";
import { useState, useEffect } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoVideocamOffOutline, IoVideocamOutline } from "react-icons/io5";
import { Me } from "../Me";

export function WaitingRoom({
  onJoinRoom,
}: {
  onJoinRoom: (settings: {
    userName: string;
    isMicOn: boolean;
    isCameraOn: boolean;
  }) => void;
}) {
  const [userName, setUserName] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);
  const roomClient = useRoomClient();
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );

  const isCameraEnabled = useSelector((state) => state.room.isCameraEnabled);

  const validateUserName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z0-9._ ]+$/;
    return nameRegex.test(name);
  };

  useEffect(() => {
    if (userName && !validateUserName(userName)) {
      setNameError(
        "Username can only contain letters, numbers, dots, underscores, and spaces."
      );
    } else {
      setNameError(null);
    }
  }, [userName]);

  const toggleCamera = async () => {
    if (!isCameraEnabled) {
      roomClient.enableWebcam({ produce: false });
    } else {
      await roomClient.disableWebcam();
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
    if (!userName || nameError) return;
    onJoinRoom({
      userName,
      isMicOn: isMicrophoneEnabled,
      isCameraOn: isCameraEnabled,
    });
  };

  return (
    <div className="flex flex-col items-center  w-full p-8">
      <h2 className="text-3xl font-semibold mb-8">Waiting Room</h2>
      <div className="relative w-full max-w-2xl h-96 bg-black rounded-lg overflow-hidden mb-4">
        <Me />
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
          className={`w-full py-3 px-4 text-base rounded-lg border ${
            nameError ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:border-blue-500`}
        />
        {nameError && (
          <div className="mt-1 text-sm text-red-500">{nameError}</div>
        )}
      </div>

      <Button
        variant="primary"
        onClick={handleJoinRoom}
        disabled={!userName || Boolean(nameError)}
      >
        Join Room
      </Button>
    </div>
  );
}
