import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Gauge,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AgentPipeline } from "../components/cards/AgentPipeline";
import { CardHead } from "../components/cards/CardHead";
import { MentionCard } from "../components/cards/MentionCard";
import { MetricCard } from "../components/cards/MetricCard";
import { TopicCard } from "../components/cards/TopicCard";
import { ActivityChart } from "../components/charts/ActivityChart";
import type {
  ChartPoint,
  Mention,
  OrchestratorRun,
  RiskMetric,
  Summary,
  TopicMetric,
} from "../models/types";

export type CommandCenterPageProps = {
  summary: Summary | null;
  risk: RiskMetric | null;
  topics: TopicMetric[];
  mentions: Mention[];
  chart: ChartPoint[];
  analysis: OrchestratorRun | null;
  onAnalysis: () => void;
  onMention: (m: Mention) => void;
  onAgent: (name: string) => void;
  onNavigate: (p: string) => void;
};

export default function CommandCenterPage({
  summary,
  risk,
  topics,
  mentions,
  chart,
  analysis,
  onAnalysis,
  onMention,
  onAgent,
  onNavigate,
}: CommandCenterPageProps) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">WEDNESDAY · 24 HOUR WINDOW</span>
          <h2>Good morning, Marketing team</h2>
          <p className="subhead">
            Your brand is being discussed across the public web.
          </p>
        </div>
        <button className="primary" onClick={onAnalysis}>
          <Sparkles size={16} /> {analysis ? "Run again" : "Run AI Analysis"}
        </button>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Brand health"
          value={summary?.brand_health ?? 0}
          suffix="/100"
          tone="positive"
          icon={<Gauge />}
          spark={[72, 75, 76, 80, 82, 84]}
        />
        <MetricCard
          label="Total mentions"
          value={summary?.mentions ?? 0}
          tone="neutral"
          icon={<Activity />}
          spark={[40, 44, 42, 58, 51, 64]}
        />
        <MetricCard
          label="Negative sentiment"
          value={summary?.negative_sentiment ?? 0}
          suffix="%"
          tone="negative"
          icon={<AlertTriangle />}
          spark={[22, 21, 19, 18, 17, 16]}
        />
        <MetricCard
          label="Current risk"
          value={Math.round(risk?.predicted_risk ?? 0)}
          tone="critical"
          icon={<ShieldAlert />}
          spark={[34, 38, 42, 51, 64, risk?.predicted_risk ?? 0]}
          suffix="/100"
          detail={`Current ${risk?.severity ?? "LOW"} · predicted risk`}
        />
      </div>

      <section className="grid-main">
        <ActivityChart data={chart} />
        <article className="card insight-card">
          <CardHead
            title="What is happening?"
            help="Highest-volume active issue cluster."
          />
          <div className="risk-callout">
            <span className="risk-icon">
              <ShieldAlert size={19} />
            </span>
            <div>
              <span className="eyebrow">ISSUE CLUSTER</span>
              <h3>{risk?.cluster ?? "No active risk"}</h3>
              <p>
                {risk?.negative_pct ?? 0}% negative · {risk?.growth_pct ?? 0}%
                growth · z-score {risk?.z_score ?? 0}
              </p>
            </div>
          </div>
          <div className="action-box">
            <span className="eyebrow">RECOMMENDED ACTION</span>
            <strong>{risk?.action ?? "Continue monitoring."}</strong>
          </div>
        </article>
      </section>

      <section className="grid-main">
        <AgentPipeline analysis={analysis} onAgent={onAgent} />
        <article className="card">
          <CardHead
            title="Trending topics"
            help="Ranked by current mention volume."
            actions={
              <button
                className="text-button"
                onClick={() => onNavigate("Topics & Trends")}
              >
                Inspect <ChevronRight size={13} />
              </button>
            }
          />
          <div className="rank-list">
            {topics.slice(0, 5).map((t, i) => (
              <TopicCard
                key={t.name}
                topic={t}
                rank={i + 1}
                onClick={() => onNavigate("Topics & Trends")}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="grid-main">
        <article className="card">
          <CardHead
            title="Top-impact conversations"
            help="Impact score is computed by the influence formula."
          />
          <div className="mention-list">
            {mentions
              .slice(0, 3)
              .sort((a, b) => b.impact - a.impact)
              .map((m) => (
                <MentionCard
                  key={m.id}
                  mention={m}
                  onClick={() => onMention(m)}
                />
              ))}
          </div>
        </article>
        <article className="card">
          <CardHead
            title="Live activity"
            help="Newest classified signals."
            actions={
              <button
                className="text-button"
                onClick={() => onNavigate("Live Mentions")}
              >
                View all <ChevronRight size={13} />
              </button>
            }
          />
          <div className="mention-list">
            {mentions.slice(0, 4).map((m) => (
              <MentionCard
                key={m.id}
                mention={m}
                onClick={() => onMention(m)}
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
