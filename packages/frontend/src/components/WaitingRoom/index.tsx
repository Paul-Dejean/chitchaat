import { Button } from "@/ui-library/Button";
import { IconButton } from "@/ui-library/IconButton";
import { TextInput } from "@/ui-library/TextInput";

import { useState } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoVideocamOffOutline, IoVideocamOutline } from "react-icons/io5";
import { StreamPlayer } from "../StreamPlayer";

export function WaitingRoom({
  onJoinRoom,
}: {
  onJoinRoom: (userName: string) => void;
}) {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");

  const toggleCamera = async () => {
    if (!isCameraOn) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });
      setVideoStream(stream);
      setIsCameraOn((isCameraOn) => !isCameraOn);
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setIsCameraOn((isCameraOn) => !isCameraOn);
    }
  };

  const toggleMic = () => {
    setIsMicOn((isMicOn) => !isMicOn);
  };

  const handleJoinRoom = () => {
    if (userName) {
      onJoinRoom(userName);
    }
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
          isAudioEnabled={isMicOn}
        />
      </div>

      <div className="flex gap-4 mb-12 w-full max-w-2xl justify-center">
        <IconButton
          icon={
            isMicOn ? <BiMicrophone size={22} /> : <BiMicrophoneOff size={22} />
          }
          aria-label="Toggle Microphone"
          variant={isMicOn ? "primary" : "danger"}
          onClick={() => {
            toggleMic();
          }}
          className="hover:scale-105 transition-transform duration-200"
        />
        <IconButton
          icon={
            isCameraOn ? (
              <IoVideocamOutline size={22} />
            ) : (
              <IoVideocamOffOutline size={22} />
            )
          }
          aria-label="Toggle Video"
          variant={isCameraOn ? "primary" : "danger"}
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
