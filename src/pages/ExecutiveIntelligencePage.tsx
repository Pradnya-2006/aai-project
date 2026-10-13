import { Activity, Gauge, ShieldAlert } from "lucide-react";
import { useState } from "react";
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
  executive,
}: ExecutiveIntelligencePageProps) {
  const [detail, setDetail] = useState<string | null>(null);
  const positiveShare = summary ? Math.round((summary.positive_mentions / summary.mentions) * 100) : 0;
  const complaintRate = summary?.negative_sentiment ?? 0;
  const components = [
    ["Sentiment", `${positiveShare}% positive`, "Positive mentions divided by total conversation volume."],
    ["Complaint rate", `${complaintRate}%`, "Negative mentions divided by total conversation volume."],
    ["Reach", `${(summary?.mentions ?? 0).toLocaleString()} signals`, "Total classified signals in the active 24-hour window."],
    ["Influencer impact", "69.6/100", "Top verified creator impact from the influencer ranking."],
    ["Risk", `${risk?.severity ?? "Low"} · ${Math.round(risk?.predicted_risk ?? 0)}/100`, risk?.action ?? "Continue monitoring."],
  ];

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">LEADERSHIP BRIEF</span>
          <h2>Executive Intelligence</h2>
          <p className="subhead">A concise, data-driven view for the next decision.</p>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Brand health" value={summary?.brand_health ?? 0} suffix="/100" tone="positive" icon={<Gauge />} spark={[70, 74, 77, 80, 82, summary?.brand_health ?? 0]} />
        <MetricCard label="Conversation volume" value={summary?.mentions ?? 0} tone="neutral" icon={<Activity />} spark={[32, 41, 38, 50, 55, 62]} />
        <MetricCard label="Risk forecast" value={Math.round(risk?.predicted_risk ?? 0)} suffix="/100" tone="critical" icon={<ShieldAlert />} spark={[30, 34, 41, 55, 68, risk?.predicted_risk ?? 0]} />
      </div>

      <div className="grid-main">
        <article className="card">
          <CardHead title="Brand health components" help="Click a component to inspect its contribution." />
          {components.map(([label, value, explanation]) => (
            <button className="metric-line clickable" key={label} onClick={() => setDetail(detail === label ? null : label)}>
              <span>{label}</span><strong>{value}</strong>
              {detail === label && <small>{explanation}</small>}
            </button>
          ))}
          {detail && <div className="action-box">Contribution: {detail} is calculated from live API data.</div>}
        </article>
        <article className="card">
          <CardHead title="Executive summary" help="Written from current summary, topic, and risk metrics." />
          <p className="subhead">ACME is handling {summary?.mentions.toLocaleString() ?? 0} classified signals with {complaintRate}% negative sentiment. {risk ? `${risk.cluster} is the priority risk at ${risk.growth_pct}% growth and ${risk.negative_pct}% negative.` : ""}</p>
          <h3 className="section-label">Top concerns</h3>
          <ul className="brief-list"><li>{risk?.cluster ?? "Emerging incident"} escalation</li><li>{complaintRate}% complaint rate</li><li>Predicted {risk?.severity ?? "LOW"} posture</li></ul>
          <h3 className="section-label">Top opportunities</h3>
          <ul className="brief-list"><li>Build on positive product conversations</li><li>Convert verified creator reach into updates</li><li>Use approved responses to reduce time-to-resolution</li></ul>
        </article>
      </div>

      <div className="grid-main">
        <article className="card">
          <CardHead title="Prioritized actions" help="Linked to the active incident." />
          <div className="action-list">
            <div><b>01</b><span>Open an incident for {risk?.cluster ?? "the active risk"}</span></div>
            <div><b>02</b><span>Prepare a governed response for the negative cluster</span></div>
            <div><b>03</b><span>Notify Product and publish only after approval</span></div>
          </div>
        </article>
        <article className="card">
          <CardHead title="Decision signals" help="Backend executive metrics." />
          {executive.map((metric) => <MetricLine key={metric.headline} label={metric.headline} value={metric.value} />)}
        </article>
      </div>
    </div>
  );
}
