"use client";

import { useEffect, useRef } from "react";

type PeerProps = {
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
};

export function Peer({ audioTrack, videoTrack }: PeerProps) {
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
    <div className="w-full h-full">
      <div className="relative h-full ">
        {audioTrack && (
          <audio className="h-full" ref={audioRef} autoPlay playsInline />
        )}
        {videoTrack ? (
          <video
            className="h-full rounded-lg"
            ref={videoRef}
            autoPlay
            playsInline
          />
        ) : (
          <div className="h-full w-full rounded-lg bg-gray-100"></div>
        )}
      </div>
    </div>
  );
}
