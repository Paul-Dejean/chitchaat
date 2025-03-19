import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Peer } from "../Peer";

function getVideoHeight(nbParticipants: number, isSmallScreen: boolean) {
  if (isSmallScreen) {
    if (nbParticipants <= 1) {
      return "h-full";
    }
    if (nbParticipants <= 3) {
      return "h-1/2";
    }
    return "h-1/3";
  }

  if (nbParticipants <= 2) {
    return "h-full";
  }
  if (nbParticipants <= 6) {
    return "h-1/2";
  }
  return "h-1/3";
}

function getVideoWidth(nbParticipants: number, isSmallScreen: boolean) {
  if (isSmallScreen) {
    if (nbParticipants <= 2) {
      return "w-full";
    }

    return "w-1/2";
  }
  if (nbParticipants === 1) {
    return "w-full";
  }
  if (nbParticipants <= 4) {
    return "w-1/2";
  }
  return "w-1/3";
}

type Peer = {
  id: string;
  displayName: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isMicrophoneEnabled: boolean;
  isMe: boolean;
};
export function PeerGrid({ peers }: { peers: Peer[] }) {
  const nbParticipants = peers.length;
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const videoHeight = getVideoHeight(nbParticipants, isSmallScreen);
  const videoWidth = getVideoWidth(nbParticipants, isSmallScreen);
  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute inset-0">
        <div className="flex justify-center flex-wrap h-full w-full overflow-auto items-center">
          {peers.map(
            ({
              audioTrack,
              videoTrack,
              id,
              displayName,
              isMicrophoneEnabled,
              isMe,
            }) => (
              <div
                key={id}
                className={` flex justify-center items-center ${videoHeight} ${videoWidth} p-2`}
              >
                <div className="h-full w-full bg-gray-700 rounded-lg">
                  <Peer
                    audioTrack={audioTrack}
                    videoTrack={videoTrack}
                    displayName={isMe ? "You" : displayName}
                    isMicrophoneEnabled={isMicrophoneEnabled}
                    isMe={isMe}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
