import { Peer } from "../Peer";

type Peer = {
  id: string;
  displayName: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isMicrophoneEnabled: boolean;
  isMe: boolean;
};
export function PeerStacked({ peers }: { peers: Peer[] }) {
  const others = peers.filter((peer) => !peer.isMe);
  const me = peers.filter((peer) => peer.isMe)[0];
  if (!me) return null;

  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute inset-0">
        <div className="flex flex-col justify-center max-h-full h-full w-full overflow-auto items-center gap-y-2">
          {others.map(
            ({
              audioTrack,
              videoTrack,
              id,
              displayName,
              isMicrophoneEnabled,
            }) => (
              <Peer
                key={id}
                audioTrack={audioTrack}
                videoTrack={videoTrack}
                displayName={displayName}
                isMicrophoneEnabled={isMicrophoneEnabled}
                isMe={false}
              />
            )
          )}
        </div>
        {peers.length >= 2 ? (
          <div className="absolute max-w-45 w-full   bottom-2 right-2 shadow-lg  ">
            <Peer
              audioTrack={null}
              videoTrack={me.videoTrack}
              displayName={"You"}
              isMicrophoneEnabled={me.isMicrophoneEnabled}
              isMe={true}
              isSmall={true}
            />
          </div>
        ) : (
          <div className="absolute h-full   inset-2 ">
            <Peer
              audioTrack={null}
              videoTrack={me.videoTrack}
              displayName={"You"}
              isMicrophoneEnabled={me.isMicrophoneEnabled}
              isMe={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
