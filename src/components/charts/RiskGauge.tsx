import type { CSSProperties } from "react";

export type RiskGaugeProps = {
  score: number;
};

export function RiskGauge({ score }: RiskGaugeProps) {
  return (
    <div className="gauge">
      <div
        className="gauge-arc"
        style={{ "--score": `${score}%` } as CSSProperties}
      >
        <strong>{score.toFixed(0)}</strong>
        <small>/ 100</small>
      </div>
    </div>
  );
}
