import { InputHTMLAttributes } from "react";

export function TextInput({ ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="px-2 resize-none border-sky-700 border rounded-lg "
      {...props}
    />
  );
}
