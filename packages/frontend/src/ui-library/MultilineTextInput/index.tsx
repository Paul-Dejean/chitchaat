import React, { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  icon?: React.ReactNode;
  multiline?: boolean;
};

export function MultiLineTextInput({ ...props }: TextareaProps) {
  return (
    <textarea
      className="px-2 resize-none border-sky-700 border rounded-lg field-sizing-content w-full"
      {...props}
    />
  );
}
