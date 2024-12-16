"use client";
import { Button } from "@/components/ui-library/Button";
import { IconButton } from "@/components/ui-library/IconButton";
import { GrMicrophone } from "react-icons/gr";
import { IoVideocamOutline } from "react-icons/io5";
import { TbDeviceDesktopShare } from "react-icons/tb";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

export function VideoPlayerControls({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="w-full flex justify-center items-center gap-x-4">
        <IconButton
          icon={<GrMicrophone size={20} />}
          aria-label="Mute"
          onClick={() => {}}
        />
        <IconButton
          icon={<IoVideocamOutline size={20} />}
          aria-label="Toggle Video"
          onClick={() => {}}
        />
        <Button
          className="bg-red-500 rounded-full text-white py-2 px-8"
          onClick={() => {}}
        >
          End Call
        </Button>
        <IconButton
          icon={<TbDeviceDesktopShare size={20} />}
          aria-label="Share Desktop"
          onClick={() => {}}
        />
        <IconButton
          icon={<IoChatbubbleEllipsesOutline size={20} />}
          aria-label="Toggle Chat"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}
