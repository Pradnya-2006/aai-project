import { MetricLine } from "../components/ui/MetricLine";
import type { CompetitorMetric } from "../models/types";

export type CompetitorsPageProps = {
  competitors: CompetitorMetric[];
};

export default function CompetitorsPage({ competitors }: CompetitorsPageProps) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">COMPETITIVE INTELLIGENCE</span>
          <h2>Competitors</h2>
        </div>
      </div>

      <div className="campaign-grid">
        {competitors.map((c) => (
          <article className="card" key={c.name}>
            <span className="eyebrow">{c.name}</span>
            <div className="success-score">
              {c.share_of_voice}
              <small>% share of voice</small>
            </div>
            <MetricLine label="Negative" value={`${c.negative_pct}%`} />
            <MetricLine label="Brand health" value={`${c.brand_health}/100`} />
          </article>
        ))}
      </div>
    </div>
  );
}
