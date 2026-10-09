import { Inbox } from "lucide-react";

export type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({
  title,
  description = "Try adjusting the global filters.",
}: EmptyStateProps) {
  return (
    <div className="empty">
      <Inbox size={26} />
      <strong>{title}</strong>
      <span className="muted">{description}</span>
    </div>
  );
}

// Keep Empty alias
export { EmptyState as Empty };
