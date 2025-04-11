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
      className="flex justify-center gap-x-2 md:p-4 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        icon={
          isMicrophoneEnabled ? (
            <BiMicrophone size={20} />
          ) : (
            <BiMicrophoneOff size={20} />
          )
        }
        aria-label="Toggle Microphone"
        variant={isMicrophoneEnabled ? "primary" : "danger"}
        onClick={() => {
          onToggleAudioClick();
        }}
      />
      <IconButton
        icon={
          isCameraEnabled ? (
            <IoVideocamOutline size={20} />
          ) : (
            <IoVideocamOffOutline size={20} />
          )
        }
        aria-label="Toggle Video"
        variant={isCameraEnabled ? "primary" : "danger"}
        onClick={() => {
          onToggleVideoClick();
        }}
      />
      <Button
       variant="danger"
        onClick={() => {
          onEndCallClick();
        }}
      >
        End Call
      </Button>
      <IconButton
        icon={<TbDeviceDesktopShare size={20} />}
        aria-label="Share Desktop"
        variant={isScreenSharingEnabled  ? "primary" : "danger"}
        onClick={() => {
          onToggleShareDesktopClick();
        }}
      />
      <IconButton
        icon={<IoChatbubbleEllipsesOutline size={20} />}
        variant={isChatOpen ? "primary" : "danger"}
        aria-label="Toggle Chat"
        onClick={() => {
          onToggleChatClick();
        }}
      />
    </div>
  );
};
