import type { ReactNode } from "react";

export type StatusBadgeProps = {
  variant?: "healthy" | "critical" | "default";
  pulse?: boolean;
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

export function StatusBadge({
  variant = "default",
  pulse = false,
  dot = false,
  children,
  className = "",
}: StatusBadgeProps) {
  const variantClass = variant !== "default" ? variant : "";
  return (
    <span className={`status-pill ${variantClass} ${className}`.trim()}>
      {pulse && <span className="pulse" />}
      {dot && "● "}
      {children}
    </span>
  );
}

export type SeverityBadgeProps = {
  severity: "low" | "medium" | "high" | "critical" | string;
  className?: string;
};

export function SeverityBadge({
  severity,
  className = "",
}: SeverityBadgeProps) {
  const normalized = severity.toLowerCase();
  return (
    <span className={`severity ${normalized} ${className}`.trim()}>
      {severity}
    </span>
  );
}
