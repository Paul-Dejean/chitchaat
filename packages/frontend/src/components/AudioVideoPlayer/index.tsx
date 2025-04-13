import { useIsSpeaking } from "@/hooks/useIsSpeaking";
import { useEffect, useMemo, useRef } from "react";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";

type StreamPlayerProps = {
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isAudioEnabled: boolean;
  displayName: string;
  isMe: boolean;
};

export function AudioVideoPlayer({
  audioTrack,
  videoTrack,
  displayName,
  isAudioEnabled = false,
  isMe,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioStream = useMemo(() => {
    if (audioTrack) {
      return new MediaStream([audioTrack]);
    }
    return null;
  }, [audioTrack]);

  const isSpeaking = useIsSpeaking(audioStream);

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
    }
  }, [audioStream]);

  return (
    <div
      className={`relative group h-full w-full  bg-surface flex justify-center items-center  rounded-lg`}
    >
      {isSpeaking && (
        <div className="absolute inset-0 border-2 border-primary rounded-lg" />
      )}
      {audioTrack && <audio ref={audioRef} autoPlay={!isMe} />}
      {videoTrack ? (
        <video
          className={`h-full w-full object-fit`}
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div
          className={`h-full w-full rounded-lg justify-center items-center flex flex-col gap-y-2 p-2 bg-surface`}
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
      {isSpeaking && (
        <div className="absolute bottom-2 left-2 bg-primary rounded-full p-1">
          <BiMicrophone size={25} />
        </div>
      )}
    </div>
  );
}
