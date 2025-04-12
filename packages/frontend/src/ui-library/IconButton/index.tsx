import { ButtonHTMLAttributes, ReactNode } from "react";

export const IconButton = ({
  icon,
  variant = "default",
  disabled = false,
  ariaLabel,
  label,
  className = "",
  ...props
}: {
  icon: ReactNode;
  variant?: "primary" | "danger" | "default";
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  label?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`
        p-2.5 rounded-full flex items-center justify-center transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${
          variant === 'primary'
            ? 'bg-primary text-base hover:bg-primary-hover'
            : variant === 'danger'
            ? 'bg-danger text-base hover:bg-danger-hover'
            : 'bg-surface text-base hover:bg-surface-hover'
        }
        ${className}
      `}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {icon}
      {label && (
        <span className="ml-2 text-sm text-muted">
          {label}
        </span>
      )}
    </button>
  );
};