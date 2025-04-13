import { useRoomClient } from "@/contexts/RoomContext";
import { useDispatch, useSelector } from "@/store";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { isMobileDevice } from "@/utils/device";
import { roomActions } from "@/store/slices/room";
import { LuArrowLeft } from "react-icons/lu";

export function Chat({ isOpen }: { isOpen: boolean }) {
  const roomClient = useRoomClient();
  const messages = useSelector((state) => state.room.messages);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);
  const dispatch = useDispatch();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom every time messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show toast notification when new messages arrive and chat is closed
  useEffect(() => {
    console.log("triggered", { isOpen, messages, prevMessagesLength });
    if (!isOpen && messages.length > prevMessagesLength) {
      const lastMessage = messages[messages.length - 1];
      console.log({ lastMessage });
      if (lastMessage && !lastMessage.isMe) {
        console.log("toasting");
        toast(`${lastMessage.sender}: ${lastMessage.message}`);
      }
    }
    setPrevMessagesLength(messages.length);
  }, [messages, isOpen, prevMessagesLength]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={` bg-surface rounded-lg transition-all duration-200 h-full relative flex-shrink-0 ${
        isOpen
          ? isMobileDevice()
            ? "w-screen z-10000"
            : "w-[250px] mx-2"
          : "w-0 overflow-hidden delay-200 bg-background"
      }`}
    >
      <div className={`absolute inset-0`}>
        <div
          className={`flex flex-col h-full mx-4 py-4 transition-opacity duration-50 ${isOpen ? "opacity-100 delay-200" : "opacity-0"}`}
        >
          {isMobileDevice() && (
            <div
              className="cursor-pointer"
              onClick={() =>
                dispatch(roomActions.toggleChat({ shouldOpenChat: false }))
              }
            >
              <button
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                onClick={() =>
                  dispatch(roomActions.toggleChat({ shouldOpenChat: false }))
                }
                aria-label="Close chat"
              >
                <LuArrowLeft className="h-6 w-6 text-primary" />
              </button>
            </div>
          )}
          <div className="space-y-2 overflow-y-auto flex-1">
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
          <div className="mt-auto flex-shrink-0">
            <ChatInput
              onSendMessage={(message) => roomClient.sendChatMessage(message)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
