type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "muted";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-inverted hover:bg-primary-hover",
  secondary: "bg-surface text-base hover:bg-border",
  danger: "bg-danger text-inverted hover:bg-red-600",
  muted: "text-muted hover:text-base",
};

export function Button({
  children,
  onClick,
  className,
  variant = "primary",
}: ButtonProps) {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClass = variantClasses[variant];

  return (
    <button
      role="button"
      onClick={onClick}
      className={`${base} ${variantClass} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
