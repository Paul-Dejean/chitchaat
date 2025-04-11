import { useSelector } from "@/store";
import { Button } from "@/ui-library/Button";
import { IconButton } from "@/ui-library/IconButton";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import {
  IoVideocamOutline,
  IoVideocamOffOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { TbDeviceDesktopShare } from "react-icons/tb";

export const VideoBoardControls = ({
  onToggleAudioClick,
  onToggleVideoClick,
  onEndCallClick,
  onToggleShareDesktopClick,
  onToggleChatClick,
}: {
  onToggleAudioClick: () => void;
  onToggleVideoClick: () => void;
  onEndCallClick: () => void;
  onToggleShareDesktopClick: () => void;
  onToggleChatClick: () => void;
}) => {
  const isMicrophoneEnabled = useSelector(
    (state) => state.room.isMicrophoneEnabled
  );
  const isCameraEnabled = useSelector((state) => state.room.isCameraEnabled);
  const isScreenSharingEnabled = useSelector(
    (state) => state.room.isScreenSharingEnabled
  );
  const isChatOpen = useSelector((state) => state.room.isChatOpen);

  return (
    <div
      className="flex justify-center items-center gap-x-3 md:p-4 p-3 bg-surface/80 backdrop-blur-sm rounded-lg shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        icon={
          isMicrophoneEnabled ? (
            <BiMicrophone size={22} />
          ) : (
            <BiMicrophoneOff size={22} />
          )
        }
        aria-label="Toggle Microphone"
        variant={isMicrophoneEnabled ? "primary" : "danger"}
        onClick={() => {
          onToggleAudioClick();
        }}
        className="hover:scale-105 transition-transform duration-200"
      />
      <IconButton
        icon={
          isCameraEnabled ? (
            <IoVideocamOutline size={22} />
          ) : (
            <IoVideocamOffOutline size={22} />
          )
        }
        aria-label="Toggle Video"
        variant={isCameraEnabled ? "primary" : "danger"}
        onClick={() => {
          onToggleVideoClick();
        }}
        className="hover:scale-105 transition-transform duration-200"
      />
      <Button
        variant="danger"
        onClick={() => {
          onEndCallClick();
        }}
        className="px-5 py-2 font-medium hover:bg-danger-hover transition-colors duration-200 shadow-lg"
      >
        End Call
      </Button>
      <IconButton
        icon={<TbDeviceDesktopShare size={22} />}
        aria-label="Share Desktop"
        variant={isScreenSharingEnabled ? "primary" : "danger"}
        onClick={() => {
          onToggleShareDesktopClick();
        }}
        className="hover:scale-105 transition-transform duration-200"
      />
      <IconButton
        icon={<IoChatbubbleEllipsesOutline size={22} />}
        variant={isChatOpen ? "primary" : "danger"}
        aria-label="Toggle Chat"
        onClick={() => {
          onToggleChatClick();
        }}
        className="hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
};
