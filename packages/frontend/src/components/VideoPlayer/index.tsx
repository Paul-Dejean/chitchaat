"use client";
import { useEffect, useRef, useState } from "react";
import { VideoPlayerControls } from "./components/VideoPlayerControls";

export function VideoPlayer() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    }

    if (!stream) {
      enableStream();
    } else {
      return function cleanup() {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      };
    }
  }, [stream]);

  return (
    <div className=" h-full grid place-items-center">
      <div className="relative h-full">
        <video
          className="h-full rounded-lg"
          ref={videoRef}
          autoPlay
          playsInline
        />
        <VideoPlayerControls className="absolute z-10 bottom-0 p-4 flex justify-center w-full" />
      </div>
    </div>
  );
}
