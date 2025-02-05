import { Peer } from "../Peer";

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
  const videoHeight = getVideoHeight(nbParticipants);
  const videoWidth = getVideoWidth(nbParticipants);
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
                <Peer
                  audioTrack={audioTrack}
                  videoTrack={videoTrack}
                  displayName={isMe ? "You" : displayName}
                  isMicrophoneEnabled={isMicrophoneEnabled}
                  isMe={isMe}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
