"use client";

import { useEffect, useRef } from "react";
import { VideoPlayerControls } from "./components/VideoPlayerControls";

export function VideoPlayer({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!stream || !videoRef) return;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return function cleanup() {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [stream]);

  return (
    <div className=" h-full grid place-items-center">
      <div className="relative h-full w-full">
        <video
          className="h-full rounded-lg "
          ref={videoRef}
          autoPlay
          playsInline
        />
        <VideoPlayerControls className="absolute z-1 bottom-0 p-4 flex justify-center w-full" />
      </div>
    </div>
  );
}
