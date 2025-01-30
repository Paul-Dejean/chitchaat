"use client";
import { Peer } from "../Peer";

import { useState } from "react";

import { useRoomClient } from "@/contexts/RoomContext";

import { useDispatch, useSelector } from "@/store";

import {
  IoChatbubbleEllipsesOutline,
  IoVideocamOffOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { TbDeviceDesktopShare } from "react-icons/tb";
import { Button } from "../../ui-library/Button";
import { IconButton } from "../../ui-library/IconButton";

import { roomActions } from "@/store/slices/room";
import { useRouter } from "next/navigation";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

import { Chat } from "../Chat";

function getVideoHeight(nbParticipants: number) {
  if (nbParticipants <= 2) {
    return "h-full";
  }
  if (nbParticipants <= 6) {
    return "h-1/2";
  }
  return "h-1/3";
}

function getVideoWidth(nbParticipants: number) {
  if (nbParticipants === 1) {
    return "w-full";
  }
  if (nbParticipants <= 4) {
    return "w-1/2";
  }
  return "w-1/3";
}

export function VideoBoard() {
  const roomClient = useRoomClient();
  const roomState = useSelector((state) => state.room);
  const peers = useSelector((state) => state.room.peers);
  const consumers = useSelector((state) => state.room.consumers);
  const isChatOpen = useSelector((state) => state.room.isChatOpen);
  console.log({ consumers });

  const allPeers = Object.values(peers)
    .filter((peer) => !peer.isMe)
    .map((peer) => {
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
        isAudioPaused: audioConsumer?.isPaused ?? true,
        isVideoPaused: videoConsumer?.isPaused ?? true,
      };
    });

  console.log({ isChatOpen, allPeers });

  const dispatch = useDispatch();
  const router = useRouter();

  const [currentTrack, setCurrentTrack] = useState<MediaStreamTrack | null>(
    null
  );

  async function onEndCallClick() {
    await roomClient.leaveRoom();
    router.push("/");
  }

  async function onToggleVideoClick() {
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
      console.log({ currentTrack });
      currentTrack?.stop();
      console.log({ currentTrack });
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
    if (!roomState.isChatOpen) {
      dispatch(roomActions.toggleChat({ shouldOpenChat: true }));
    } else {
      dispatch(roomActions.toggleChat({ shouldOpenChat: false }));
    }
  }

  const nbParticipants = allPeers.length + 1;
  const videoHeight = getVideoHeight(nbParticipants);
  const videoWidth = getVideoWidth(nbParticipants);

  return (
    <div className="flex flex-col h-full mt-4 gap-4">
      <div className="flex flex-1">
        <div className="relative h-full flex-1 overflow-auto">
          <div className="absolute inset-0">
            <div className="flex justify-center flex-wrap h-full w-full overflow-auto items-center">
              <div
                className={`flex justify-center items-center ${videoHeight} ${videoWidth}  p-2`}
              >
                <Peer
                  videoTrack={currentTrack}
                  isMicrophoneEnabled={roomState.isAudioEnabled}
                  displayName={"me"}
                  isMe={true}
                />
              </div>
              {allPeers.map(
                ({
                  audioTrack,
                  videoTrack,
                  id,
                  displayName,
                  isAudioPaused,
                }) => (
                  <div
                    key={id}
                    className={` flex justify-center items-center ${videoHeight} ${videoWidth}  p-2`}
                  >
                    <Peer
                      audioTrack={audioTrack}
                      videoTrack={videoTrack}
                      displayName={displayName}
                      isMicrophoneEnabled={!isAudioPaused}
                      isMe={false}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        <div className="p-2">
          <Chat isOpen={isChatOpen} />
        </div>
      </div>

      <div className="p-4 flex gap-x-2 justify-center w-full shrink-0">
        <IconButton
          icon={
            roomState.isAudioEnabled ? (
              <BiMicrophone size={20} />
            ) : (
              <BiMicrophoneOff size={20} />
            )
          }
          aria-label="Toggle Microphone"
          className={`${!roomState.isAudioEnabled && "bg-red-500"}`}
          onClick={() => {
            onToggleAudioClick();
          }}
        />
        <IconButton
          icon={
            roomState.isVideoEnabled ? (
              <IoVideocamOutline size={20} />
            ) : (
              <IoVideocamOffOutline size={20} />
            )
          }
          aria-label="Toggle Video"
          className={`${!roomState.isVideoEnabled && "bg-red-500"}`}
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
          className={`${!roomState.isScreenSharingEnabled && "bg-red-500"}`}
          onClick={() => {
            onToggleShareDesktopClick();
          }}
        />
        <IconButton
          icon={<IoChatbubbleEllipsesOutline size={20} />}
          className={`${!roomState.isChatOpen && "bg-red-500"}`}
          aria-label="Toggle Chat"
          onClick={() => {
            onToggleChatClick();
          }}
        />
      </div>
    </div>
  );
}
