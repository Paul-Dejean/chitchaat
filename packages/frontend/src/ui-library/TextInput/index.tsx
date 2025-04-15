import { InputHTMLAttributes } from "react";

export function TextInput({ ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`px-2 resize-none border rounded-lg border-gray-300 focus:outline-none focus:border-blue-500 ${props.className}`}
    />
  );
}
