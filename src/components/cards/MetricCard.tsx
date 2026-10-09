import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export type MetricCardProps = {
  label: string;
  value: number;
  suffix?: string;
  tone: string;
  icon: ReactNode;
  spark: number[];
  detail?: string;
};

export function MetricCard({
  label,
  value,
  suffix,
  tone,
  icon,
  spark,
  detail,
}: MetricCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="card kpi-card"
      initial={false}
      animate={reduceMotion ? undefined : { opacity: 1 }}
    >
      <div className="kpi-head">
        <span className="eyebrow">{label}</span>
        <span className={`kpi-icon ${tone}`}>{icon}</span>
      </div>
      <div className="kpi-value">
        {value.toLocaleString()}
        <small>{suffix}</small>
      </div>
      <div className="sparkline">
        {spark.map((n, i) => (
          <i
            key={i}
            style={{ height: `${Math.max(8, Math.min(100, n))}%` }}
          />
        ))}
      </div>
      <small className="muted">{detail ?? "computed from current data"}</small>
    </motion.article>
  );
}
