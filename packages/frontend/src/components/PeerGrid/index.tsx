import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Peer } from "../Peer";
import { useState } from "react";

import { Draggable } from "../Draggable";
import { useLongPress } from "@/hooks/useLongPress";

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
export function PeerGrid({ peers }: { peers: Peer[] }) {
  const [meFloating, setMeFloating] = useState(false);

  const nbParticipants = peers.length;
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const touchHandlers = useLongPress({
    onLongPress: () => setMeFloating((meFloating) => !meFloating),
  });

  let gridPeers = peers;
  const me = peers.find((peer) => peer.isMe);

  if (meFloating) {
    gridPeers = peers.filter((peer) => !peer.isMe);
  }

  const { cols, rows } = getGridDimensions(gridPeers.length, isSmallScreen);

  console.log({ me });
  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute inset-0">
        <Draggable bound="parent">
          {meFloating && me && (
            <div
              {...touchHandlers}
              className={`transform transition-all duration-300 ease-in-out origin-top-left
                 w-48 aspect-ratio-16/9`}
            >
              <Peer
                audioTrack={me?.audioTrack}
                videoTrack={me?.videoTrack}
                displayName={"You"}
                isMicrophoneEnabled={me?.isMicrophoneEnabled}
                isMe={true}
                onExpandClick={() => setMeFloating(false)}
                isSmall={true}
                nbParticipants={nbParticipants}
                isExpanded={!meFloating}
              />
            </div>
          )}
        </Draggable>
        <div className="flex justify-center flex-wrap h-full w-full overflow-auto items-center ">
          {gridPeers.map(
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
                style={{
                  width: `${100 / cols}%`,
                  height: `${Math.max(100 / rows, 25)}%`,
                }}
                className={`flex justify-center items-center p-2`}
              >
                <div
                  className="h-full w-full bg-gray-700 rounded-lg"
                  {...(isMe ? touchHandlers : {})}
                >
                  <Peer
                    audioTrack={audioTrack}
                    videoTrack={videoTrack}
                    displayName={isMe ? "You" : displayName}
                    isMicrophoneEnabled={isMicrophoneEnabled}
                    isMe={isMe}
                    onExpandClick={() => {
                      if (nbParticipants == 1) return;
                      setMeFloating(true);
                    }}
                    nbParticipants={nbParticipants}
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
