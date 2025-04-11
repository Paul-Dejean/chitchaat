import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { LuExpand, LuMinimize2 } from "react-icons/lu";

type PeerProps = {
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  displayName: string;
  isMe: boolean;
  isMicrophoneEnabled?: boolean;
  isSmall?: boolean;
  onExpandClick?: () => void;
  isExpanded?: boolean;
  nbParticipants?: number;
};

export function Peer({
  audioTrack,
  videoTrack,
  displayName,
  isMicrophoneEnabled = false,
  isSmall = false,
  isMe = false,
  onExpandClick,
  isExpanded = true,
  nbParticipants = 0,
}: PeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      console.log("setting video track", { videoTrack });
      console.log(videoTrack?.readyState); // should be "live"
      console.log(videoTrack?.enabled);
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      // console.log({ videoRef: videoRef.current });
      // videoRef.current.play();
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      audioRef.current.srcObject = new MediaStream([audioTrack]);
    }
  }, [audioTrack]);

  return (
    <div className="relative group h-full w-full  flex justify-center items-center ">
      {audioTrack && <audio ref={audioRef} autoPlay />}
      {videoTrack ? (
        <video
          className={`h-full w-full rounded-lg ${isSmallScreen ? "object-cover" : "object-fit"}`}
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div
          className={`h-full w-full rounded-lg  justify-center items-center flex flex-col gap-y-2 p-2 bg-surface`}
        >
          {isMicrophoneEnabled ? (
            <div>
              <BiMicrophone size={isSmall ? 20 : 60} />
            </div>
          ) : (
            <div>
              <BiMicrophoneOff size={isSmall ? 20 : 60} />
            </div>
          )}
          <span
            className={`text-gray-400  text-bold line-clamp-1 ${isSmall ? "text-sm" : "text-2xl"}`}
          >
            {displayName}
          </span>
        </div>
      )}
      {isMe && nbParticipants >= 2 && (
        <div
          data-nodrag
          className="group-hover:block hidden absolute bottom-0 right-0 bg-white p-1 rounded-lg"
        >
          {isExpanded ? (
            <LuMinimize2 size={20} onClick={onExpandClick} />
          ) : (
            <LuExpand size={20} onClick={onExpandClick} />
          )}
        </div>
      )}
    </div>
  );
}
