type IconButtonProps = {
  icon: React.ReactNode;
  onClick: () => void;
  "aria-label": string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "muted";
};

const variantClasses: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  primary: "bg-primary text-inverted hover:bg-primary-hover",
  secondary: "bg-surface text-base hover:bg-border",
  danger: "bg-danger text-inverted hover:bg-red-600",
  muted: "text-muted hover:text-base",
};

export function IconButton({
  icon,
  onClick,
  className,
  "aria-label": ariaLabel,
  variant = "primary",
}: IconButtonProps) {
  const base = "p-2 rounded-full transition-colors";
  const variantClass = variantClasses[variant];

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      role="button"
      className={`${base} ${variantClass} ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}