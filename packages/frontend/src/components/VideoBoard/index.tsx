import { useState } from "react";

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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { isMobileDevice } from "@/utils/device";

async function getVideoStream(isPortrait: boolean) {
  const isMobile = isMobileDevice();

  console.log({ supported: navigator.mediaDevices.getSupportedConstraints() });
  const constraints = {
    video: {
      // width: isMobile && isPortrait ? 720 : 1280,
      // height: isMobile && isPortrait ? 1280 : 720,
      // aspectRatio: isMobile && isPortrait ? 9 / 16 : 16 / 9,
      facingMode: "user",
    },
  };
  console.log({ isPortrait, isMobile });
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  // const track = stream.getVideoTracks()[0];
  // console.log(track.getSettings());
  // await track.applyConstraints({
  //   aspectRatio: isMobile && isPortrait ? 9 / 16 : 16 / 9,
  // });
  return stream;
}

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
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

  const dispatch = useDispatch();
  const isPortrait = useMediaQuery("(orientation: portrait)");

  const allPeers = Object.values(peers).map((peer) => {
    if (peer.isMe) {
      return {
        id: peer.id,
        displayName: peer.displayName,
        audioTrack: null,
        videoTrack: currentStream?.getVideoTracks()[0] || null,
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
        const stream = await getVideoStream(isPortrait);
        setCurrentStream(stream);
        await roomClient.enableWebcam();
        dispatch(roomActions.toggleVideo({ shouldEnableVideo: true }));
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      const track = currentStream?.getVideoTracks()[0];
      track?.stop();
      setCurrentStream(null);
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
        const stream = await roomClient.enableScreenSharing();
        if (stream) {
          setCurrentStream(stream);
        }

        dispatch(
          roomActions.toggleScreenSharing({ shouldEnableScreenSharing: true })
        );
      } catch (err) {
        console.error("Failed to get the stream", err);
      }
    } else {
      const track = currentStream?.getVideoTracks()[0];
      track?.stop();
      setCurrentStream(null);
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
                backgroundColor: "var(--color-gray-700)",
                top: 0,
                transform: `translateY(${areControlsVisibles ? "0px" : "-100%"})`,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                borderRadius: "0px 0px 20px 20px",
                border: "1px solid black",
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
                backgroundColor: "var(--color-gray-700)",
                bottom: 0,
                transform: `translateY(${areControlsVisibles ? "0px" : "100%"})`,
                transition: "transform 0.3s ease, opacity 0.3s ease",
                borderRadius: "20px 20px 0px 0px",
                border: "1px solid black",
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
