"use client";

import { useEffect, useRef } from "react";
import { GrMicrophone } from "react-icons/gr";
import {
  IoChatbubbleEllipsesOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { TbDeviceDesktopShare } from "react-icons/tb";
import { Button } from "../ui-library/Button";
import { IconButton } from "../ui-library/IconButton";
import { useDispatch, useSelector } from "@/store";

type VideoPlayerProps = {
  stream: MediaStream | null;
  displayControls?: boolean;
};

export function VideoPlayer({ stream, displayControls }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const state = useSelector((state) => state);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!stream || !videoRef) return;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return function cleanup() {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [stream]);

  return (
    <div className=" h-full grid place-items-center">
      <div className="relative h-full">
        <video
          className="h-full rounded-lg "
          ref={videoRef}
          autoPlay
          playsInline
        />
        {displayControls && (
          <div className="absolute z-1 bottom-0 p-4 flex gap-x-2 justify-center w-full">
            <IconButton
              icon={<GrMicrophone size={20} />}
              aria-label="Toggle Microphone"
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
        )}
      </div>
    </div>
  );
}
