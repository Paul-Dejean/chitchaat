import { useSelector } from "@/store";
import { AudioVideoPlayer } from "../AudioVideoPlayer";
import { useMemo } from "react";

export function Me() {
  const videoStream = useSelector((state) => state.media.videoStream);
  const audioStream = useSelector((state) => state.media.audioStream);
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );

  const audioTrack = useMemo(() => {
    return audioStream?.getTracks()?.[0] ?? null;
  }, [audioStream]);

  const videoTrack = useMemo(() => {
    return videoStream?.getTracks()?.[0] ?? null;
  }, [videoStream]);

  return (
    <AudioVideoPlayer
      audioTrack={isMicrophoneEnabled ? audioTrack : null}
      videoTrack={videoTrack}
      displayName="You"
      isAudioEnabled={isMicrophoneEnabled}
      isMe={true}
    />
  );
}
