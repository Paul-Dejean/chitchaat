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
    <button role="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
