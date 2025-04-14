import { useState } from "react";

import { useRoomClient } from "@/contexts/RoomContext";

import { useDispatch, useSelector } from "@/store";

import { Button } from "../../ui-library/Button";

import { roomActions } from "@/store/slices/room";

import { Modal } from "@/ui-library/Modal";
import { isMobileDevice } from "@/utils/device";
import { IoMdPerson } from "react-icons/io";
import { useNavigate } from "react-router";
import { Chat } from "../Chat";
import { InviteGuest } from "../InviteGuest";
import { PeerGrid } from "../PeerGrid";
import { MeetingBoardControls } from "../MeetingBoardControls";

export function MeetingBoard() {
  const navigate = useNavigate();
  const [areControlsVisibles, setAreControlsVisibles] = useState(true);

  const roomClient = useRoomClient();
  const peers = useSelector((state) => state.room.peers);
  const consumers = useSelector((state) => state.room.consumers);
  const isChatOpen = useSelector((state) => state.room.isChatOpen);
  const [isModalOpen, setModalOpen] = useState(false);
  const isCameraEnabled = useSelector((state) => state.room.isCameraEnabled);
  const presenter = useSelector((state) => state.room.presenter);
  console.log({ presenter });
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );
  const isScreenSharingEnabled = useSelector(
    (state) => state.room.isScreenSharingEnabled
  );

  const videoStream = useSelector((state) => state.media.videoStream);
  const audioStream = useSelector((state) => state.media.audioStream);

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
        await roomClient.enableWebcam();
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableWebcam();
    }
  }

  async function onToggleAudioClick() {
    if (!isMicrophoneEnabled) {
      try {
        await roomClient.enableMicrophone();
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableMicrophone();
    }
  }

  async function onToggleShareDesktopClick() {
    if (!isScreenSharingEnabled) {
      try {
        await roomClient.enableScreenSharing();
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      await roomClient.disableScreenSharing();
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
      <div className="flex flex-1 ">
        <div className="w-full h-full">
          <PeerGrid peers={allPeers} presenter={presenter} />
        </div>
        <div className="md:py-2">
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
        <MeetingBoardControls
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
