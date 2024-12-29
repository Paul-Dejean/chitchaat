import { mediasoupClient } from "@/services/mediasoup";
import { RtpCapabilities } from "mediasoup-client/lib/types";
import { useEffect } from "react";

async function createProducer(roomId: string, stream: MediaStream) {
  const data = await mediasoupClient.emitMessage<{
    routerRtpCapabilities: RtpCapabilities;
  }>("getRouterRtpCapabilities", { roomId });

  await mediasoupClient.loadDevice(data.routerRtpCapabilities);
  console.log("creating transport");
  const transport = await mediasoupClient.createProducerTransport(roomId);

  const track = stream.getVideoTracks()[0];
  try {
    console.log("producing");
    const producer = await transport.produce({ track });
    console.log({ producer });
    return producer;
  } catch (error) {
    console.error("Failed to produce", error);
  }
}

export function useProduceMediaStream(
  roomId: string,
  stream: MediaStream | null
) {
  useEffect(() => {
    console.log("useProduceMediaStream", { roomId, stream });
    if (!stream?.active) return;
    createProducer(roomId, stream);
  }, [stream, roomId]);
}
