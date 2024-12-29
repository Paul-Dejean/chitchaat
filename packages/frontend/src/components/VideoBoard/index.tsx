"use client";
import { Room } from "@/services/rooms";
import { VideoPlayer } from "../VideoPlayer";
import { useProduceMediaStream } from "@/lib/useProduceMediaStream";
import { useEffect, useState } from "react";
import { mediasoupClient } from "@/services/mediasoup";
import { consumeProducer } from "@/lib/useConsumeMediaStream";

export function VideoBoard({ room }: { room: Room }) {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [consumerStreams, setConsumerStreams] = useState<MediaStream[]>([]);
  const [producers, setProducers] = useState<any>([]);
  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setCurrentStream(stream);
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    }

    if (!currentStream) {
      enableStream();
    }
  }, [currentStream]);

  useEffect(() => {
    setTimeout(async () => {
      console.log({ roomId: room.id });
      if (!room?.id) return;
      console.log("hello");
      const producers = await mediasoupClient.getRoomProducers(room.id);
      console.log({ producers });
      setProducers(producers);
    }, 2000);
  }, [room.id]);

  useEffect(() => {
    (async () => {
      const consumers = await Promise.all(
        producers.map((producer: { id: string }) =>
          consumeProducer(room.id, producer.id)
        )
      );
      const streams = consumers.map((consumer) => {
        const stream = new MediaStream([consumer.track]);
        return stream;
      });
      setConsumerStreams(streams);
      setTimeout(
        () =>
          consumers.forEach((consumer) =>
            mediasoupClient.emitMessage("resumeConsumer", {
              roomId: room.id,
              consumerId: consumer.id,
            })
          ),
        1000
      );
    })();
  }, [producers, room.id]);

  useProduceMediaStream(room.id, currentStream);

  return (
    <div className="flex flex-col mt-4 gap-4">
      <VideoPlayer stream={currentStream} />
      {consumerStreams.map((stream) => (
        <VideoPlayer key={stream.id} stream={stream} />
      ))}
    </div>
  );
}
