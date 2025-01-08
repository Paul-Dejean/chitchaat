import React, { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
};

export function TextInput({ ...props }: InputProps) {
  return <input className="px-2" {...props} />;
}
