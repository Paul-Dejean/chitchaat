"use client";

import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type PeerProps = {
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
  displayName: string;
  isMe: boolean;
  isMicrophoneEnabled?: boolean;
};

export function Peer({
  audioTrack,
  videoTrack,
  displayName,

  isMicrophoneEnabled = false,
}: PeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      console.log("setting video track");
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      audioRef.current.srcObject = new MediaStream([audioTrack]);
    }
  }, [audioTrack]);

  console.log({
    audioTrack,
    videoTrack,
    isMicrophoneEnabled,
    videoRef,
    audioRef,
  });

  return (
    <div className="relative h-full ">
      {audioTrack && <audio className="h-full" ref={audioRef} autoPlay />}
      {videoTrack ? (
        <video
          className="h-full rounded-lg w-full object-cover"
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div className="h-full w-full rounded-lg bg-gray-700 justify-center items-center flex flex-col gap-y-4">
          {isMicrophoneEnabled ? (
            <div>
              <BiMicrophone size={60} />
            </div>
          ) : (
            <div>
              <BiMicrophoneOff size={60} />
            </div>
          )}
          <span className="text-gray-400 text-4xl text-bold">
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
}
