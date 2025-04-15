import React, { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  icon?: React.ReactNode;
  multiline?: boolean;
};

export function MultiLineTextInput({ ...props }: TextareaProps) {
  return (
    <textarea
      className="px-2 resize-none border-gray-300 focus:outline-none focus:border-blue-500 border rounded-lg field-sizing-content w-full max-h-64"
      {...props}
    />
  );
}
