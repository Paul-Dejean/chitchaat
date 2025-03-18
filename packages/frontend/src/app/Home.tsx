import { Button } from "@/ui-library/Button";
import { useEffect } from "react";
import { createRoom } from "@/services/rooms";
import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    window.localStorage.setItem(
      "debug",
      "mediasoup-client:WARN* mediasoup-client:ERROR*"
    );
  }, []);

  const onCreateRoomClick = async () => {
    const { id: roomId } = await createRoom();
    console.log({ redirect: `/rooms/?roomId=${roomId}` });
    navigate(`/rooms?roomId=${roomId}`);
  };
  return (
    <main className="h-screen  flex items-center justify-center bg-background">
      <Button className="bg-white rounded-lg p-4" onClick={onCreateRoomClick}>
        Create Room
      </Button>
    </main>
  );
}
