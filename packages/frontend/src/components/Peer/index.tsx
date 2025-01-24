"use client";

import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type PeerProps = {
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
  displayName: string;
  isMe: boolean;
  isAudioPaused: boolean;
  isVideoPaused: boolean;
  isMicrophoneEnabled?: boolean;
};

export function Peer({
  audioTrack,
  videoTrack,
  displayName,
  isAudioPaused,
  isVideoPaused,
  isMicrophoneEnabled = false,
}: PeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      console.log("setting video track");
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      if (isVideoPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [videoTrack, isVideoPaused]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      audioRef.current.srcObject = new MediaStream([audioTrack]);
      if (isAudioPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  }, [audioTrack, isAudioPaused]);

  console.log({
    audioTrack,
    videoTrack,
    isAudioPaused,
    isVideoPaused,
    videoRef,
    audioRef,
  });

  return (
    <div className="relative h-full ">
      {audioTrack && (
        <audio className="h-full" ref={audioRef} autoPlay playsInline />
      )}
      {videoTrack && !isVideoPaused ? (
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
