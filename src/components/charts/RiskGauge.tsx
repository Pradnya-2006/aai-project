import type { CSSProperties } from "react";

export type RiskGaugeProps = {
  score: number;
  severity?: string;
};

export function RiskGauge({ score, severity = "LOW" }: RiskGaugeProps) {
  return (
    <div className="gauge">
      <div
        className="gauge-arc"
        style={{ "--score": `${score}%` } as CSSProperties}
      >
        <strong>{severity.toUpperCase()}</strong>
        <small>{Math.round(score)}/100</small>
      </div>
    </div>
  );
}
