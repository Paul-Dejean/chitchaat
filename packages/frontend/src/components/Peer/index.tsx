"use client";

import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type PeerProps = {
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
  isMicrophoneEnabled?: boolean;
};

export function Peer({
  audioTrack,
  videoTrack,
  isMicrophoneEnabled = false,
}: PeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      audioRef.current.srcObject = new MediaStream([audioTrack]);
    }
  }, [audioTrack]);

  return (
    <div className="relative h-full ">
      {audioTrack && (
        <audio className="h-full" ref={audioRef} autoPlay playsInline />
      )}
      {videoTrack ? (
        <video
          className="h-full rounded-lg w-full object-cover"
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div className="h-full w-full rounded-lg bg-gray-700 justify-center items-center flex">
          {isMicrophoneEnabled ? (
            <div>
              <BiMicrophone size={60} />
            </div>
          ) : (
            <div>
              <BiMicrophoneOff size={60} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
