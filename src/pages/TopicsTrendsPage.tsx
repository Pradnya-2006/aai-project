import { useState } from "react";
import { CardHead } from "../components/cards/CardHead";
import { TopicBubble } from "../components/cards/TopicCard";
import { EmptyState } from "../components/feedback/EmptyState";
import { MetricLine } from "../components/ui/MetricLine";
import type { TopicMetric } from "../models/types";

export type TopicsTrendsPageProps = {
  topics: TopicMetric[];
};

export default function TopicsTrendsPage({ topics }: TopicsTrendsPageProps) {
  const [selected, setSelected] = useState<TopicMetric | null>(topics[0] ?? null);

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">CLUSTER MAP</span>
          <h2>Topics & Trends</h2>
          <p className="subhead">
            Volume, sentiment, and risk in one interactive network.
          </p>
        </div>
      </div>

      <div className="topic-layout">
        <div className="card bubble-network">
          {topics.map((t, i) => (
            <TopicBubble
              key={t.name}
              topic={t}
              index={i}
              onClick={() => setSelected(t)}
            />
          ))}
        </div>

        <div className="card inspector">
          <CardHead
            title="Cluster inspector"
            help="Select a bubble to inspect its computed metrics."
          />
          {selected ? (
            <>
              <span className="eyebrow">SELECTED TOPIC</span>
              <h3>{selected.name}</h3>
              <div className="metric-stack">
                <MetricLine
                  label="Volume"
                  value={selected.mentions.toLocaleString()}
                />
                <MetricLine label="Growth" value={`${selected.growth}%`} />
                <MetricLine
                  label="Negative"
                  value={`${selected.negative_pct}%`}
                />
                <MetricLine label="Velocity" value={selected.velocity} />
                <MetricLine
                  label="Risk"
                  value={selected.negative_pct >= 60 ? "CRITICAL" : selected.negative_pct >= 35 ? "HIGH" : selected.negative_pct >= 15 ? "MEDIUM" : "LOW"}
                />
              </div>
              <div className="sample-list">
                <span className="eyebrow">SAMPLE MENTIONS</span>
                {(selected.samples ?? []).map((sample) => <p key={sample}>{sample}</p>)}
              </div>
            </>
          ) : (
            <EmptyState title="Select a topic bubble" />
          )}
        </div>
      </div>
    </div>
  );
}
