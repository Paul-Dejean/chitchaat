import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Peer } from "../Peer";
import { useState } from "react";

import { Draggable } from "../Draggable";

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
  console.log({ peers });
  const [meFloating, setMeFloating] = useState(false);
  const [isSmallPreview, setIsSmallPreview] = useState(false);
  const nbParticipants = meFloating ? peers.length - 1 : peers.length;
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const { cols, rows } = getGridDimensions(nbParticipants, isSmallScreen);

  let gridPeers = peers;
  const me = peers.find((peer) => peer.isMe);

  if (meFloating) {
    gridPeers = peers.filter((peer) => !peer.isMe);
  }

  console.log({ me });
  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute inset-0">
        <Draggable bound="parent">
          {meFloating && me && (
            <div
              onClick={() => {
                setIsSmallPreview((smallPreview) => !smallPreview);
              }}
              className={`transform transition-all duration-300 ease-in-out origin-top-left ${
                isSmallPreview ? "w-32 h-32" : "w-64 h-64"
              }
               `}
            >
              <Peer
                audioTrack={me?.audioTrack}
                videoTrack={me?.videoTrack}
                displayName={"You"}
                isMicrophoneEnabled={me?.isMicrophoneEnabled}
                isMe={true}
                onExpandClick={() => setMeFloating(false)}
                isSmall={true}
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
                <div className="h-full w-full bg-gray-700 rounded-lg">
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
