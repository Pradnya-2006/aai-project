export type MetricLineProps = {
  label: string;
  value: string;
};

export function MetricLine({ label, value }: MetricLineProps) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
