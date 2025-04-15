import { InputHTMLAttributes } from "react";

export function TextInput({ ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="px-2 resize-none border rounded-lg border-gray-300"
      {...props}
    />
  );
}
