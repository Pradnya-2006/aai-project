import { MetricLine } from "../components/ui/MetricLine";
import type { CampaignMetric } from "../models/types";

export type CampaignsPageProps = {
  campaigns: CampaignMetric[];
};

export default function CampaignsPage({ campaigns }: CampaignsPageProps) {
  const tags = ["#Launch2026", "#BuildWithAcme", "#DarkMode"];

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">CAMPAIGN INTELLIGENCE</span>
          <h2>Campaigns</h2>
          <p className="subhead">
            Compare success signals across active initiatives.
          </p>
        </div>
      </div>

      <div className="campaign-grid">
        {tags.map((tag, i) => {
          const c = campaigns[i % Math.max(campaigns.length, 1)];
          return (
            <article className="card campaign-card" key={tag}>
              <span className="eyebrow">{tag}</span>
              <h3>{c?.name ?? "Awaiting data"}</h3>
              <div className="success-score">
                {c
                  ? Math.round(
                      c.positive_pct * 0.7 +
                        Math.min(100, c.engagement / 10) * 0.3,
                    )
                  : 0}
                <small>success score</small>
              </div>
              <MetricLine
                label="Mentions"
                value={(c?.mentions ?? 0).toLocaleString()}
              />
              <MetricLine label="Status" value={c?.status ?? "—"} />
            </article>
          );
        })}
      </div>
    </div>
  );
}
