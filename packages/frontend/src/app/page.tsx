"use client";
import { Button } from "@/ui-library/Button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/services/rooms";

export default function Home() {
  useEffect(() => {
    window.localStorage.setItem(
      "debug",
      "mediasoup-client:WARN* mediasoup-client:ERROR*"
    );
  }, []);
  const router = useRouter();
  const onCreateRoomClick = async () => {
    const { id: roomId } = await createRoom();
    console.log({ redirect: `/rooms/?roomId=${roomId}` });
    router.push(`/rooms/?roomId=${roomId}`, {});
  };
  return (
    <main className="h-screen  flex items-center justify-center">
      <Button className="bg-white rounded-lg p-4" onClick={onCreateRoomClick}>
        Create Room
      </Button>
    </main>
  );
}
