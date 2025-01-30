import { BiChat, BiMessage } from "react-icons/bi";
import { TextInput } from "../../ui-library/TextInput";
import { useEffect, useRef, useState } from "react";
import { useRoomClient } from "@/contexts/RoomContext";
import { useSelector } from "@/store";

export function Chat({ isOpen }: { isOpen: boolean }) {
  const roomClient = useRoomClient();
  const messages = useSelector((state) => state.room.messages);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom every time messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div
      className={`bg-white rounded-lg transition-all duration-200 h-full relative flex-shrink-0 ${
        isOpen ? "w-[250px]" : "w-0 overflow-hidden delay-200 bg-background"
      }`}
    >
      <div className={`absolute inset-0`}>
        <div
          className={`flex flex-col h-full mx-4 py-2 transition-opacity duration-50 ${isOpen ? "opacity-100 delay-200" : "opacity-0"}`}
        >
          <div className="flex flex-col gap-y-2 overflow-y-auto flex-grow-0">
            {messages.map(({ message, isMe, sender, timestamp }) => (
              <div
                className={`${isMe ? "ml-auto bg-green-500" : "mr-auto bg-blue-500"} px-2 py-1 rounded-lg flex flex-col`}
                key={`${sender}-${timestamp}`}
              >
                <label className="flex gap-x-4">
                  <span className="font-bold">{isMe ? "You" : sender}</span>{" "}
                  <span className="">{`${new Date(timestamp).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`}</span>
                </label>
                <span className="text-sm">{message}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-auto">
            <ChatInput
              onSendMessage={(message) => roomClient.sendChatMessage(message)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  function onSendMessageClick() {
    if (!message) {
      return;
    }
    onSendMessage(message);
    setMessage("");
  }
  return (
    <div className="flex gap-x-2 items-center">
      <TextInput
        value={message}
        icon={<BiChat className="text-primary" size={20} />}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSendMessageClick();
          }
        }}
        onChange={(event) => setMessage(event.target.value)}
      />
      <BiMessage
        className={`text-primary  ${message ? "text-primary cursor-pointer" : "text-gray-300 cursor-default"}`}
        size={20}
        onClick={onSendMessageClick}
      />
    </div>
  );
}
