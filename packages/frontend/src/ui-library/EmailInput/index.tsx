import { InputHTMLAttributes } from "react";

export function EmailInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="email" placeholder="Email" className="p-2" />;
}
