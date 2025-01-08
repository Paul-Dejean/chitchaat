import { BiChat, BiMessage } from "react-icons/bi";
import { TextInput } from "../../ui-library/TextInput";
import { useState } from "react";

export function Chat({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className={`bg-white rounded-lg transition-all duration-300 ${
        isOpen ? "w-80" : "w-0"
      }`}
    >
      {isOpen ? (
        <div className="flex flex-col h-full">
          <div className="flex-1">messages</div>

          <div className="p-4">
            <ChatInput onSendMessage={(message) => console.log({ message })} />
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
    <div className="flex gap-x-2">
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
