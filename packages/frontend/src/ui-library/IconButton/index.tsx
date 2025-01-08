export function IconButton({
  icon,
  onClick,
  className,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  "aria-label": string;
}) {
  return (
    <button
      className={`bg-primary text-white rounded-full p-2 ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      role="button"
    >
      {icon}
    </button>
  );
}
