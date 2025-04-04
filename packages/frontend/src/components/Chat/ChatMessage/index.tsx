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
      className={`${isMe ? "ml-auto bg-green-500" : "mr-auto bg-blue-500"} px-2 py-1 rounded-lg flex flex-col`}
    >
      <label className="flex gap-x-4">
        <span className="font-bold">{isMe ? "You" : sender}</span>{" "}
        <span className="">{`${new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`}</span>
      </label>
      <span className="text-sm">{message}</span>
    </div>
  );
}
