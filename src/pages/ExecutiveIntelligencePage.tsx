import { Activity, Gauge, ShieldAlert } from "lucide-react";
import { CardHead } from "../components/cards/CardHead";
import { MetricCard } from "../components/cards/MetricCard";
import { MetricLine } from "../components/ui/MetricLine";
import type { ExecutiveMetric, RiskMetric, Summary } from "../models/types";

export type ExecutiveIntelligencePageProps = {
  summary: Summary | null;
  risk: RiskMetric | null;
  executive: ExecutiveMetric[];
};

export default function ExecutiveIntelligencePage({
  summary,
  risk,
  executive: _executive,
}: ExecutiveIntelligencePageProps) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">LEADERSHIP BRIEF</span>
          <h2>Executive Intelligence</h2>
          <p className="subhead">
            A concise, data-driven view for the next decision.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Brand health"
          value={summary?.brand_health ?? 0}
          suffix="/100"
          tone="positive"
          icon={<Gauge />}
          spark={[70, 74, 77, 80, 82, summary?.brand_health ?? 0]}
        />
        <MetricCard
          label="Conversation volume"
          value={summary?.mentions ?? 0}
          tone="neutral"
          icon={<Activity />}
          spark={[32, 41, 38, 50, 55, 62]}
        />
        <MetricCard
          label="Risk forecast"
          value={risk?.predicted_risk ?? 0}
          suffix="/100"
          tone="critical"
          icon={<ShieldAlert />}
          spark={[30, 34, 41, 55, 68, risk?.predicted_risk ?? 0]}
        />
      </div>

      <div className="grid-main">
        <article className="card">
          <CardHead
            title="Brand health components"
            help="The displayed score is the computed sentiment mix."
          />
          <MetricLine
            label="Positive share"
            value={`${
              summary
                ? Math.round((summary.positive_mentions / summary.mentions) * 100)
                : 0
            }%`}
          />
          <MetricLine
            label="Neutral share"
            value={`${
              summary
                ? Math.round((summary.neutral_mentions / summary.mentions) * 100)
                : 0
            }%`}
          />
          <MetricLine
            label="Negative share"
            value={`${summary?.negative_sentiment ?? 0}%`}
          />
          <MetricLine
            label="Computed health"
            value={`${summary?.brand_health ?? 0}/100`}
          />
        </article>

        <article className="card">
          <CardHead
            title="Prioritized actions"
            help="Linked to the active incident."
          />
          <div className="action-list">
            <div>
              <b>01</b>
              <span>Escalate {risk?.cluster ?? "active risk"} response</span>
            </div>
            <div>
              <b>02</b>
              <span>Review the negative conversation cluster</span>
            </div>
            <div>
              <b>03</b>
              <span>Publish only after human approval</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
