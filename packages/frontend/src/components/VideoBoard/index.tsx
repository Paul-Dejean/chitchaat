"use client";
import { Room } from "@/services/rooms";
import { Peer } from "../Peer";

import { useContext, useEffect, useState } from "react";

import { RoomContext } from "@/contexts/RoomContext";
import { RoomClientState } from "@/lib/roomClient";
import { useDispatch, useSelector } from "@/store";
import { GrMicrophone } from "react-icons/gr";
import {
  IoVideocamOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { TbDeviceDesktopShare } from "react-icons/tb";
import { Button } from "../ui-library/Button";
import { IconButton } from "../ui-library/IconButton";

import { roomActions } from "@/store/slices/room";
import { useRouter } from "next/navigation";

export function VideoBoard({ room }: { room: Room }) {
  const roomClient = useContext(RoomContext);
  const roomState = useSelector((state) => state.room);
  const consumers = useSelector((state) => state.room.consumers);

  const peerIds = [...new Set(consumers.map((consumer) => consumer.peerId))];
  console.log(peerIds);
  const consumerPerPeer = peerIds.map((peerId) => ({
    peerId,
    audioTrack: consumers.filter(
      (consumer) =>
        consumer.peerId === peerId && consumer.track.kind === "audio"
    )?.[0]?.track,
    videoTrack: consumers.filter(
      (consumer) =>
        consumer.peerId === peerId && consumer.track.kind === "video"
    )?.[0]?.track,
  }));

  console.log(consumerPerPeer);

  const dispatch = useDispatch();
  const router = useRouter();
  useEffect(() => {
    roomClient.reset();
    if (roomClient.state === RoomClientState.NEW) {
      roomClient.joinRoom(room.id);
    }
  }, [room.id, roomClient]);

  const [currentTrack, setCurrentTrack] = useState<MediaStreamTrack | null>(
    null
  );

  async function onEndCallClick() {
    await roomClient.close();
    router.push("/");
  }

  async function onToggleVideoClick() {
    console.log("toggle");
    console.log(roomState);
    if (!roomState.isVideoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        console.log({ stream });
        const track = stream.getVideoTracks()[0];
        setCurrentTrack(track);
        await roomClient.enableWebcam();
        dispatch(roomActions.toggleVideo({ shouldEnableVideo: true }));
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      setCurrentTrack(null);
      await roomClient.disableWebcam();
      dispatch(roomActions.toggleVideo({ shouldEnableVideo: false }));
    }
  }

  async function onToggleAudioClick() {
    console.log("toggle");
    console.log(roomState);
    if (!roomState.isAudioEnabled) {
      try {
        await roomClient.enableMicrophone();
        dispatch(roomActions.toggleAudio({ shouldEnableAudio: true }));
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableMicrophone();
      dispatch(roomActions.toggleAudio({ shouldEnableAudio: false }));
    }
  }

  async function onToggleShareDesktopClick() {
    console.log("toggle");
    console.log(roomState);
    if (!roomState.isScreenSharingEnabled) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        console.log({ stream });
        const track = stream.getVideoTracks()[0];
        setCurrentTrack(track);
        await roomClient.enableScreenSharing();
        dispatch(
          roomActions.toggleScreenSharing({ shouldEnableScreenSharing: true })
        );
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      setCurrentTrack(null);
      await roomClient.disableScreenSharing();
      dispatch(
        roomActions.toggleScreenSharing({ shouldEnableScreenSharing: false })
      );
    }
  }

  return (
    <div className="flex flex-col h-full mt-4 gap-4">
      <Peer videoTrack={currentTrack} />
      {consumerPerPeer.map(({ audioTrack, videoTrack, peerId }) => (
        <Peer key={peerId} audioTrack={audioTrack} videoTrack={videoTrack} />
      ))}

      <div className="p-4 flex gap-x-2 justify-center w-full">
        <IconButton
          icon={<GrMicrophone size={20} />}
          aria-label="Toggle Microphone"
          onClick={() => {
            onToggleAudioClick();
          }}
        />
        <IconButton
          icon={<IoVideocamOutline size={20} />}
          aria-label="Toggle Video"
          onClick={() => {
            onToggleVideoClick();
          }}
        />
        <Button
          className="bg-red-500 rounded-full text-white py-2 px-8"
          onClick={() => {
            onEndCallClick();
          }}
        >
          End Call
        </Button>
        <IconButton
          icon={<TbDeviceDesktopShare size={20} />}
          aria-label="Share Desktop"
          onClick={() => {
            onToggleShareDesktopClick();
          }}
        />
        <IconButton
          icon={<IoChatbubbleEllipsesOutline size={20} />}
          aria-label="Toggle Chat"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
