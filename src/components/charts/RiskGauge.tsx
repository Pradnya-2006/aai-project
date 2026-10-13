export type RiskGaugeProps = {
  score: number;
  severity?: string;
};

export function RiskGauge({ score, severity = "LOW" }: RiskGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 82;
  const arcLength = Math.PI * radius;

  return (
    <div className="gauge">
      <svg className="gauge-svg" viewBox="0 0 200 120" role="img" aria-label={`${severity} risk, ${Math.round(normalizedScore)} out of 100`}>
        <path className="gauge-track" d="M18 100 A82 82 0 0 1 182 100" pathLength={arcLength} />
        <path
          className="gauge-progress"
          d="M18 100 A82 82 0 0 1 182 100"
          pathLength={arcLength}
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength * (1 - normalizedScore / 100)}
        />
        <text className="gauge-label" x="100" y="78" textAnchor="middle">
          {severity.toUpperCase()}
        </text>
        <text className="gauge-score" x="100" y="98" textAnchor="middle">
          {Math.round(normalizedScore)}/100
        </text>
      </svg>
    </div>
  );
}
