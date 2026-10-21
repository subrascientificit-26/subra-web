interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({
  message = "Loading...",
  fullScreen = false,
}: LoadingStateProps) {
  const className = fullScreen
    ? "flex min-h-screen items-center justify-center bg-background text-xl text-foreground"
    : "py-16 text-center text-muted";

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        {message}
      </div>
    </div>
  );
}
