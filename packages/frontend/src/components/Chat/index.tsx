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
      className={`bg-white rounded-lg transition-all duration-300  ${
        isOpen ? "w-80" : "w-0"
      }`}
    >
      {isOpen ? (
        <div className="flex flex-col h-full mx-4 py-2 max-h-full">
          <div className="flex flex-col max-h-full gap-y-2 overflow-y-auto flex-grow-0">
            {messages.map(({ message, isMe, sender, timestamp }) => (
              <div
                className={`${isMe ? "ml-auto bg-green-500" : "mr-auto bg-blue-500"} px-2 rounded-lg flex flex-col`}
                key={`${sender}-${timestamp}`}
              >
                <label className="text-xs text-gray-300">{sender}</label>
                <span className="text-4xl">{message}</span>
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
      ) : null}
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
        onChange={(event) => setMessage(event.target.value)}
      />
      <BiMessage
        className={`text-primary cursor-pointer ${message ? "text-primary" : "text-gray-300"}`}
        size={20}
        onClick={onSendMessageClick}
      />
    </div>
  );
}
