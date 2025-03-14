"use client";

import { useState } from "react";

import { useRoomClient } from "@/contexts/RoomContext";

import { useDispatch, useSelector } from "@/store";

import { Button } from "../../ui-library/Button";

import { roomActions } from "@/store/slices/room";
import { useRouter } from "next/navigation";

import { Modal } from "@/ui-library/Modal";
import { IoMdPerson } from "react-icons/io";
import { Chat } from "../Chat";
import { InviteGuest } from "../InviteGuest";
import { PeerGrid } from "../PeerGrid";
import { VideoBoardControls } from "../VideoBoardControls";
import { PeerStacked } from "../PeerStacked";

export function VideoBoard() {
  const roomClient = useRoomClient();
  const peers = useSelector((state) => state.room.peers);
  const consumers = useSelector((state) => state.room.consumers);
  const isChatOpen = useSelector((state) => state.room.isChatOpen);
  const [isModalOpen, setModalOpen] = useState(false);
  const isCameraEnabled = useSelector((state) => state.room.isCameraEnabled);
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );
  const isScreenSharingEnabled = useSelector(
    (state) => state.room.isScreenSharingEnabled
  );
  const [currentTrack, setCurrentTrack] = useState<MediaStreamTrack | null>(
    null
  );

  const dispatch = useDispatch();
  const router = useRouter();

  const allPeers = Object.values(peers).map((peer) => {
    if (peer.isMe) {
      return {
        id: peer.id,
        displayName: peer.displayName,
        audioTrack: null,
        videoTrack: currentTrack,
        isMicrophoneEnabled: isMicrophoneEnabled,
        isMe: true,
      };
    }
    const audioConsumer = consumers.filter(
      (consumer) =>
        consumer.peerId === peer.id && consumer.track.kind === "audio"
    )?.[0];
    const videoConsumer = consumers.filter(
      (consumer) =>
        consumer.peerId === peer.id && consumer.track.kind === "video"
    )?.[0];
    id: return {
      id: peer.id,
      displayName: peer.displayName,
      audioTrack: audioConsumer?.track,
      videoTrack: videoConsumer?.track,
      isMicrophoneEnabled: (audioConsumer && !audioConsumer.isPaused) || false,
      isMe: false,
    };
  });

  async function onEndCallClick() {
    await roomClient.leaveRoom();
    router.push("/");
  }

  async function onToggleVideoClick() {
    if (!isCameraEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const track = stream.getVideoTracks()[0];
        setCurrentTrack(track);
        await roomClient.enableWebcam();
        dispatch(roomActions.toggleVideo({ shouldEnableVideo: true }));
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      currentTrack?.stop();
      setCurrentTrack(null);
      await roomClient.disableWebcam();
      dispatch(roomActions.toggleVideo({ shouldEnableVideo: false }));
    }
  }

  async function onToggleAudioClick() {
    if (!isMicrophoneEnabled) {
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
    if (!isScreenSharingEnabled) {
      try {
        const track = await roomClient.enableScreenSharing();
        if (track) {
          setCurrentTrack(track);
        }

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

  async function onToggleChatClick() {
    await roomClient.enableChatDataProducer();
    if (!isChatOpen) {
      dispatch(roomActions.toggleChat({ shouldOpenChat: true }));
    } else {
      dispatch(roomActions.toggleChat({ shouldOpenChat: false }));
    }
  }

  return (
    <div className="flex flex-col mt-2 h-full gap-4">
      <div className="flex flex-1">
        <div className="w-full h-full hidden lg:block">
          <PeerGrid peers={allPeers} />
        </div>
        <div className="w-full h-full lg:hidden">
          <PeerStacked peers={allPeers} />
        </div>
        <div className="py-2">
          <Chat isOpen={isChatOpen} />
        </div>
      </div>
      <div className="relative">
        <VideoBoardControls
          onEndCallClick={onEndCallClick}
          onToggleAudioClick={onToggleAudioClick}
          onToggleVideoClick={onToggleVideoClick}
          onToggleShareDesktopClick={onToggleShareDesktopClick}
          onToggleChatClick={onToggleChatClick}
        />
        <div className="absolute right-2 top-0 bottom-0 flex gap-x-4 items-center ">
          <span className="text-white flex items-center">
            <IoMdPerson /> : {Object.keys(peers).length}
          </span>
          <Button
            className="bg-white rounded-lg px-4 py-2 hidden lg:block"
            onClick={() => {
              setModalOpen(true);
            }}
          >
            Invite Guests
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <InviteGuest url={window.location.href} />
      </Modal>
    </div>
  );
}
