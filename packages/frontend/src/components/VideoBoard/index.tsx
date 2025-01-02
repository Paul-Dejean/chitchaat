"use client";
import { Room } from "@/services/rooms";
import { VideoPlayer } from "../VideoPlayer";

import { useContext, useEffect, useState } from "react";

import { RoomContext } from "@/contexts/RoomContext";
import { RoomClientState } from "@/lib/roomClient";
import { useSelector } from "@/store";

export function VideoBoard({ room }: { room: Room }) {
  const roomClient = useContext(RoomContext);
  const roomState = useSelector((state) => state.room.state);
  useEffect(() => {
    roomClient.reset();
    if (roomClient.state === RoomClientState.NEW) {
      roomClient.joinRoom(room.id);
    }
  }, [room.id, roomClient]);

  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [consumerStreams, setConsumerStreams] = useState<MediaStream[]>([]);

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
    setTimeout(() => {
      const streams = roomClient.consumers.map(
        (consumer) => new MediaStream([consumer.track])
      );
      console.log({ streams });
      setConsumerStreams(streams);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!currentStream?.active) return;
    if (roomState !== RoomClientState.CONNECTED) return;
    console.log({ currentStream, state: roomState });

    roomClient.createProducer(currentStream);
  }, [currentStream, roomState]);

  return (
    <div className="flex  mt-4 gap-4">
      <VideoPlayer stream={currentStream} displayControls={true} />
      {consumerStreams.map((stream) => (
        <VideoPlayer key={stream.id} stream={stream} />
      ))}
    </div>
  );
}
