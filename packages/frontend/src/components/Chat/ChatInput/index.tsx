import { MultiLineTextInput } from "@/ui-library/MultilineTextInput";
import { useState } from "react";
import { BiChat, BiMessage } from "react-icons/bi";

export function ChatInput({
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
    <div className="flex gap-x-2 p-2 items-center bg-surface rounded-lg">
      <MultiLineTextInput
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
