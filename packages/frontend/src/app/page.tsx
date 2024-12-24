"use client";
import { ConsumerVideoPlayer } from "@/components/ConsumerVideoPlayer";
import { ProducerVideoPlayer } from "@/components/ProducerVideoPlayer";
import { useEffect } from "react";
import { BiLogoBaidu } from "react-icons/bi";

const today = new Date();
export default function Home() {
  useEffect(() => {
    window.localStorage.setItem(
      "debug",
      "mediasoup-client:WARN* mediasoup-client:ERROR*"
    );
  }, []);
  return (
    <main className="h-screen bg-background">
      <div className="mx-8">
        <div className="pt-4 flex gap-x-4 items-center">
          <div>
            <BiLogoBaidu
              className="text-primary bg-gray-800 rounded-full p-1"
              size={40}
            />
          </div>
          <div>
            <h1 className="text-white font-bold">Business weekly meeting</h1>
            {/* <p className="text-secondary text-sm">{`${today.toLocaleDateString()} ${today.toLocaleTimeString()}`}</p> */}
          </div>
        </div>

        <div className="flex mt-4 gap-x-4">
          <ProducerVideoPlayer />
          <ConsumerVideoPlayer />
        </div>
      </div>
    </main>
  );
}
