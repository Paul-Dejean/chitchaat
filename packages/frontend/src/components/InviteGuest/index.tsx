"use client";

import qrCode from "qrcode";
import { useEffect, useRef } from "react";

export function InviteGuest({
  url,
  //   onSendEmailClick,
}: {
  url: string;
  onSendEmailClick: (email: string) => void;
}) {
  const canvasRef = useRef(null);
  //   const [email, setEmail] = useState("");
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

      {/* <div className="flex flex-col gap-4">
        <h2 className="font-bold">Or by sending an email</h2>
        <EmailInput
          onChange={(event) => setEmail(event.target.value)}
          value={email}
        />
        <Button
          className="bg-primary text-white"
          onClick={() => onSendEmailClick(email)}
        >
          Send Invite
        </Button>
      </div> */}
    </div>
  );
}
