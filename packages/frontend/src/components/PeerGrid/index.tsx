import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AudioVideoPlayer } from "../AudioVideoPlayer";
import { Me } from "../Me";

function getGridDimensions(
  numberOfParticipants: number,
  isSmallScreen: boolean
) {
  const maxCols = isSmallScreen ? 2 : 3;
  if (isSmallScreen) {
    let rows = Math.min(numberOfParticipants, maxCols);
    let cols = Math.ceil(numberOfParticipants / rows);

    // Clamp cols to maxCols
    if (cols > maxCols) {
      cols = maxCols;
      rows = Math.ceil(numberOfParticipants / cols);
    }

    return { cols, rows };
  }
  const cols = Math.min(Math.ceil(Math.sqrt(numberOfParticipants)), maxCols);
  const rows = Math.ceil(numberOfParticipants / cols);

  return { cols, rows };
}

type Peer = {
  id: string;
  displayName: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isMicrophoneEnabled: boolean;
  isMe: boolean;
};
export function PeerGrid({
  peers,
  presenter,
}: {
  peers: Peer[];
  presenter?: string | null;
}) {
  console.log({ peers });
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  if (presenter) {
    const presenterPeer = peers.find((peer) => peer.id === presenter);
    if (!presenterPeer) {
      return null;
    }

    if (presenterPeer.isMe) {
      return (
        <div className="relative h-full w-full overflow-auto">
          <div className="absolute inset-0 px-2">
            <Me />
          </div>
        </div>
      );
    }
    return (
      <div className="relative h-full w-full overflow-auto">
        <div className="absolute inset-0 px-2">
          <AudioVideoPlayer
            audioTrack={presenterPeer.audioTrack}
            videoTrack={presenterPeer.videoTrack}
            displayName={presenterPeer?.displayName}
            isAudioEnabled={presenterPeer?.isMicrophoneEnabled}
            isMe={false}
          />
        </div>
      </div>
    );
  }

  const others = peers.filter((peer) => !peer.isMe);

  const { cols, rows } = getGridDimensions(peers.length, isSmallScreen);

  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute inset-0 px-2">
        <div className="flex justify-center flex-wrap h-full w-full overflow-auto items-center ">
          <div
            key="me"
            style={{
              width: `${100 / cols}%`,
              height: `${Math.max(100 / rows, 25)}%`,
            }}
            className={`flex justify-center items-center p-2 `}
          >
            <Me />
          </div>
          {others.map(
            ({
              audioTrack,
              videoTrack,
              id,
              displayName,
              isMicrophoneEnabled,
            }) => (
              <div
                key={id}
                style={{
                  width: `${100 / cols}%`,
                  height: `${Math.max(100 / rows, 25)}%`,
                }}
                className={`flex justify-center items-center p-2`}
              >
                <AudioVideoPlayer
                  audioTrack={audioTrack}
                  videoTrack={videoTrack}
                  displayName={displayName}
                  isAudioEnabled={isMicrophoneEnabled}
                  isMe={false}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
