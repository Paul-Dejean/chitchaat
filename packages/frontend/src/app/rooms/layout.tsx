import { RoomProvider } from "@/contexts/RoomContext";

export default function RoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoomProvider>
      <div>{children}</div>;
    </RoomProvider>
  );
}
