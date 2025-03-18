import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type PeerProps = {
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  displayName: string;
  isMe: boolean;
  isMicrophoneEnabled?: boolean;
  isSmall?: boolean;
};

export function Peer({
  audioTrack,
  videoTrack,
  displayName,
  isMicrophoneEnabled = false,
  isSmall = false,
}: PeerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      console.log("setting video track");
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      audioRef.current.srcObject = new MediaStream([audioTrack]);
    }
  }, [audioTrack]);

  return (
    <div className="h-full w-full min-h-5 flex justify-center items-center ">
      {audioTrack && <audio ref={audioRef} autoPlay />}
      {videoTrack ? (
        <video
          className="h-full w-full rounded-lg  object-cover"
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div
          className={`h-full w-full rounded-lg  justify-center items-center flex flex-col gap-y-2 aspect-video ${isSmall ? "bg-gray-600" : "bg-gray-700"}`}
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
    </div>
  );
}
