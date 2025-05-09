import qrCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { LuCheck, LuClipboardCopy } from "react-icons/lu";

export function InviteGuest({ url }: { url: string }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    qrCode.toCanvas(canvasRef.current, url, function (error) {
      if (error) console.error(error);
    });
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounder-lg p-4 flex flex-col gap-8 text-black">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold ">
          You can invite guests by sharing this QR Code
        </h2>
        <canvas ref={canvasRef} className="mx-auto"></canvas>
        <h2 className="font-bold">Or by sharing this url</h2>
        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-surface w-fit">
          <span className="text-sm font-mono max-w-xs mr-2 text-base">
            {url}
          </span>
          <button onClick={handleCopy}>
            {copied ? (
              <LuCheck className="text-green-500" />
            ) : (
              <LuClipboardCopy className="text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
