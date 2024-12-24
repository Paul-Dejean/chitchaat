"use client";
import { useEffect, useRef, useState } from "react";

import { mediasoupClient } from "@/lib/mediasoupClient";
import { VideoPlayerControls } from "../ProducerVideoPlayer/components/VideoPlayerControls";
import { useEffectOnce } from "@/lib/useEffectOnce";

export function ConsumerVideoPlayer() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffectOnce(async () => {
    // setStream(
    //   await navigator.mediaDevices.getUserMedia({
    //     video: true,
    //   })
    // );
    setTimeout(() => createConsumerTransport(), 3000);
  });

  async function createConsumerTransport() {
    // const data = await mediasoupClient.emitMessage<{
    //   routerRtpCapabilities: MediasoupTypes.RtpCapabilities;
    // }>("getRouterRtpCapabilities");
    // console.log({ data });
    // await mediasoupClient.loadDevice(data.routerRtpCapabilities);
    const transport = await mediasoupClient.createConsumerTransport();
    const consumer = await mediasoupClient.consume();
    console.log({ consumer });
    const stream = new MediaStream([consumer.track]);
    // stream.addTrack(consumer.track);
    console.log({ stream });
    setStream(stream);
  }
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;

      videoRef.current.addEventListener("loadeddata", () => {
        console.log("Video data has loaded.");
      });

      videoRef.current.addEventListener("play", () => {
        console.log("Video has started playing.");
      });

      videoRef.current.addEventListener("error", (e) => {
        console.error("Error event on video:", e);
      });

      videoRef.current
        .play()
        .then(() => console.log("success"))
        .catch((error) => console.error("Error playing video:", error));
    }
  }, [stream]);

  return (
    <div className=" h-full grid place-items-center">
      <div className="relative h-full w-full">
        <video className="rounded-lg  bg-blue-500" ref={videoRef} playsInline />

        <VideoPlayerControls className="absolute z-100 bottom-0 p-4 flex justify-center w-full" />
      </div>
    </div>
  );
}
