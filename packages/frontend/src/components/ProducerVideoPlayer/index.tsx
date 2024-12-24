"use client";
import { mediasoupClient } from "@/lib/mediasoupClient";
import { types as MediasoupTypes } from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { VideoPlayerControls } from "./components/VideoPlayerControls";

export function ProducerVideoPlayer() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function createProducerTransport() {
    if (!stream) return;
    const data = await mediasoupClient.emitMessage<{
      routerRtpCapabilities: MediasoupTypes.RtpCapabilities;
    }>("getRouterRtpCapabilities");

    console.log({ data });
    await mediasoupClient.loadDevice(data.routerRtpCapabilities);
    const transport = await mediasoupClient.createProducerTransport();

    const track = stream.getVideoTracks()[0];
    try {
      const producer = await transport.produce({ track });
      console.log("produ1", { producer });
      return producer;
    } catch (error) {
      console.error("Failed to produce", error);
    }
  }

  useEffect(() => {
    createProducerTransport();
  }, [stream]);

  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
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
      <div className="relative h-full w-full">
        <video
          className="h-full rounded-lg "
          ref={videoRef}
          autoPlay
          playsInline
        />
        <VideoPlayerControls className="absolute z-10 bottom-0 p-4 flex justify-center w-full" />
      </div>
    </div>
  );
}
