import { useEffect, useState } from "react";

import { useRoomClient } from "@/contexts/RoomContext";

import { useDispatch, useSelector } from "@/store";

import { Button } from "../../ui-library/Button";

import { roomActions } from "@/store/slices/room";

import { Modal } from "@/ui-library/Modal";
import { IoMdPerson } from "react-icons/io";
import { Chat } from "../Chat";
import { InviteGuest } from "../InviteGuest";
import { PeerGrid } from "../PeerGrid";
import { VideoBoardControls } from "../VideoBoardControls";
import { useNavigate } from "react-router";
import { isMobileDevice } from "@/utils/device";

export function VideoBoard() {
  const navigate = useNavigate();
  const [areControlsVisibles, setAreControlsVisibles] = useState(true);

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
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupStream() {
      const videoStream = await roomClient.getCurrentVideoStream();
      if (videoStream) {
        setVideoStream(videoStream);
      }
      const audioStream = await roomClient.getCurrentAudioStream();
      if (audioStream) {
        setAudioStream(audioStream);
      }
    }
    setupStream();
  }, []);

  const dispatch = useDispatch();

  const allPeers = Object.values(peers).map((peer) => {
    if (peer.isMe) {
      return {
        id: peer.id,
        displayName: peer.displayName,
        audioTrack: audioStream?.getAudioTracks()[0] || null,
        videoTrack: videoStream?.getVideoTracks()[0] || null,
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
    return {
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
    navigate("/");
  }

  async function onToggleVideoClick() {
    if (!isCameraEnabled) {
      try {
        const stream = await roomClient.enableWebcam();
        setVideoStream(stream);
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableWebcam();
      setVideoStream(null);
    }
  }

  async function onToggleAudioClick() {
    if (!isMicrophoneEnabled) {
      try {
        const stream = await roomClient.enableMicrophone();
        setAudioStream(stream);
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableMicrophone();
      setAudioStream(null);
    }
  }

  async function onToggleShareDesktopClick() {
    if (!isScreenSharingEnabled) {
      try {
        const stream = await roomClient.enableScreenSharing();
        if (stream) {
          setVideoStream(stream);
        }
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableScreenSharing();
      setVideoStream(null);
    }
  }

  async function onToggleChatClick() {
    if (!isChatOpen) {
      dispatch(roomActions.toggleChat({ shouldOpenChat: true }));
    } else {
      dispatch(roomActions.toggleChat({ shouldOpenChat: false }));
    }
  }

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      onClick={() =>
        setAreControlsVisibles((areControlsVisibles) => !areControlsVisibles)
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={
          isMobileDevice()
            ? {
                position: "absolute",
                top: 0,
                transform: `translateY(${areControlsVisibles ? "0px" : "-100%"})`,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                borderRadius: "0px 0px 20px 20px",
              }
            : { visibility: "visible" }
        }
        className="w-full flex justify-end p-4 gap-x-2 z-2000"
      >
        <span className="text-white flex items-center">
          <IoMdPerson /> : {Object.keys(peers).length}
        </span>
        <Button
          variant="primary"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Invite Guests
        </Button>
      </div>
      <div className="flex flex-1">
        <div className="w-full h-full md:p-8 p-4">
          <PeerGrid peers={allPeers} />
        </div>
        <div className="py-2">
          <Chat isOpen={isChatOpen} />
        </div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={
          isMobileDevice()
            ? {
                position: "absolute",

                bottom: 0,
                transform: `translateY(${areControlsVisibles ? "0px" : "100%"})`,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                borderRadius: "20px 20px 0px 0px",
              }
            : { visibility: "visible" }
        }
        className="flex justify-center gap-x-2 p-4 w-full"
      >
        <VideoBoardControls
          onEndCallClick={onEndCallClick}
          onToggleAudioClick={onToggleAudioClick}
          onToggleVideoClick={onToggleVideoClick}
          onToggleShareDesktopClick={onToggleShareDesktopClick}
          onToggleChatClick={onToggleChatClick}
        />
        <div className="absolute right-2 top-0 bottom-0 flex gap-x-4 items-center "></div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <InviteGuest url={window.location.href} />
      </Modal>
    </div>
  );
}
