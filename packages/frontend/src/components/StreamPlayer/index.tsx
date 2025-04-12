import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEffect, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type StreamPlayerProps = {
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isAudioEnabled: boolean;
  displayName: string;
  isMe: boolean;
};

export function StreamPlayer({
  audioTrack,
  videoTrack,
  displayName,
  isAudioEnabled = false,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      console.log("setting video track", { videoTrack });
      console.log(videoTrack?.readyState); // should be "live"
      console.log(videoTrack?.enabled);
      videoRef.current.srcObject = new MediaStream([videoTrack]);
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
          {isAudioEnabled ? (
            <div>
              <BiMicrophone size={30} />
            </div>
          ) : (
            <div>
              <BiMicrophoneOff size={30} />
            </div>
          )}
          <span className={`text-gray-400  text-bold line-clamp-1 text-md`}>
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
}
