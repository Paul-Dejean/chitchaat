import { useRoomClient } from "@/contexts/RoomContext";
import { useSelector } from "@/store";
import { useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

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
        isOpen
          ? "w-[250px] ml-2"
          : "w-0 overflow-hidden delay-200 bg-background"
      }`}
    >
      <div className={`absolute inset-0`}>
        <div
          className={`flex flex-col h-full mx-4 py-2 transition-opacity duration-50 ${isOpen ? "opacity-100 delay-200" : "opacity-0"}`}
        >
          <div className="flex flex-col gap-y-2 overflow-y-auto flex-grow-0">
            {messages.map(({ message, isMe, sender, timestamp }) => (
              <ChatMessage
                key={`${sender}-${timestamp}`}
                message={message}
                isMe={isMe}
                sender={sender}
                timestamp={timestamp}
              />
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
