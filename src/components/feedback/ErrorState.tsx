import { AlertTriangle } from "lucide-react";

export type ErrorStateProps = {
  error: string;
  onRetry: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <AlertTriangle size={16} />
      {error}
      <button className="secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
