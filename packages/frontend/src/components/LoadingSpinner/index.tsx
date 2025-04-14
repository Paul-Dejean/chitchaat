interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "white" | "gray";
}

export function LoadingSpinner({
  size = "medium",
  color = "primary",
}: LoadingSpinnerProps) {
  // Define sizes
  const sizes = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  };

  // Define colors based on theme
  const colors = {
    primary: "text-primary",
    white: "text-white",
    gray: "text-gray-400",
  };

  const sizeClass = sizes[size];
  const colorClass = colors[color];

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClass} ${colorClass} animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-80 z-50">
      <LoadingSpinner size="large" color="primary" />
    </div>
  );
}
