export function ChatMessage({
  message,
  isMe,
  sender,
  timestamp,
}: {
  message: string;
  isMe: boolean;
  sender: string;
  timestamp: number;
}) {
  return (
    <div
      className={`bg-surface-3 px-2 py-1 rounded-lg flex flex-col overflow-x-hidden max-w-full`}
    >
      <label className="flex gap-x-4 justify-between">
        <span className="font-bold text-lg">{isMe ? "You" : sender}</span>{" "}
        <span className="font-normal text-sm">{`${new Date(
          timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`}</span>
      </label>
      <span className="break-words text-sm">{message}</span>
    </div>
  );
}
