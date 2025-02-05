"use client";

import qrCode from "qrcode";
import { useEffect, useRef } from "react";

export function InviteGuest({ url }: { url: string }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    qrCode.toCanvas(canvasRef.current, url, function (error) {
      if (error) console.error(error);
    });
  }, [url]);

  return (
    <div className="bg-white rounder-lg p-4 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold">
          You can invite guests by sharing this QR Code
        </h2>
        <canvas ref={canvasRef} className="mx-auto"></canvas>
      </div>
    </div>
  );
}
