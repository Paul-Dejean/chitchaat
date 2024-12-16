export function Button({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={className} onClick={onClick} role="button">
      {children}
    </button>
  );
}
