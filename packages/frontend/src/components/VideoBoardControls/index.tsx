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
      className="flex justify-center gap-x-2 p-4"
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
        className={`${!isMicrophoneEnabled && "bg-red-500"}`}
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
        className={`${!isCameraEnabled && "bg-red-500"}`}
        onClick={() => {
          onToggleVideoClick();
        }}
      />
      <Button
        className="bg-red-500 rounded-full text-white py-2 px-8"
        onClick={() => {
          onEndCallClick();
        }}
      >
        End Call
      </Button>
      <IconButton
        icon={<TbDeviceDesktopShare size={20} />}
        aria-label="Share Desktop"
        className={`${!isScreenSharingEnabled && "bg-red-500"}`}
        onClick={() => {
          onToggleShareDesktopClick();
        }}
      />
      <IconButton
        icon={<IoChatbubbleEllipsesOutline size={20} />}
        className={`${!isChatOpen && "bg-red-500"}`}
        aria-label="Toggle Chat"
        onClick={() => {
          onToggleChatClick();
        }}
      />
    </div>
  );
};
