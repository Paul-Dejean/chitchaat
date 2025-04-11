import { ButtonHTMLAttributes, ReactNode } from "react";

export const Button = ({
  children,
  variant = "default",
  disabled = false,
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "danger" | "default";
  disabled?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`
        rounded-md px-4 py-2 font-medium transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:scale-[1.02]'}
        ${
          variant === 'primary'
            ? 'bg-primary text-base hover:bg-primary-hover'
            : variant === 'danger'
            ? 'bg-danger text-base hover:bg-danger-hover'
            : 'bg-surface text-base hover:bg-surface-hover'
        }
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
