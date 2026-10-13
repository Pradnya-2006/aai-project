import { CardHead } from "../components/cards/CardHead";
import { CrisisTimelineChart } from "../components/charts/CrisisTimelineChart";
import { RiskGauge } from "../components/charts/RiskGauge";
import { MetricLine } from "../components/ui/MetricLine";
import { SeverityBadge, StatusBadge } from "../components/ui/StatusBadge";
import type { ChartPoint, RiskMetric } from "../models/types";

export type RiskCenterPageProps = {
  risk: RiskMetric | null;
  chart: ChartPoint[];
};

export default function RiskCenterPage({ risk, chart }: RiskCenterPageProps) {
  const score = risk?.predicted_risk ?? 0;

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">DETECTOR OUTPUT</span>
          <h2>Risk Center</h2>
          <p className="subhead">
            Current incident posture and two-hour forecast.
          </p>
        </div>
        <SeverityBadge severity={risk?.severity ?? "LOW"} />
      </div>

      <div className="risk-grid">
        <article className="card gauge-card">
          <CardHead
            title="Risk level"
            help="Predicted risk is computed from z-score and growth."
          />
          <RiskGauge score={score} severity={risk?.severity ?? "Low"} />
          <p className="muted">
            Predicted risk ·{" "}
            {risk?.baseline_frozen
              ? "baseline frozen during incident"
              : "baseline active"}
          </p>
        </article>

        <article className="card incident-card">
          <CardHead
            title="Active incident"
            actions={
              <StatusBadge variant="critical" dot>
                {risk?.cluster}
              </StatusBadge>
            }
          />
          <div className="incident-stats">
            <MetricLine
              label="Current / hour"
              value={String(risk?.current_per_hour ?? 0)}
            />
            <MetricLine label="Baseline" value={String(Math.round(risk?.baseline ?? 0))} />
            <MetricLine label="Z-score" value={(risk?.z_score ?? 0).toFixed(1)} />
            <MetricLine
              label="Predicted peak"
              value={(risk?.predicted_peak ?? 0).toLocaleString()}
            />
          </div>
          <div className="action-box">
            <span className="eyebrow">RECOMMENDED ACTION</span>
            <strong>{risk?.action}</strong>
          </div>
        </article>
      </div>

      <CrisisTimelineChart data={chart} />
    </div>
  );
}
