import { MetricLine } from "../components/ui/MetricLine";
import type { CampaignMetric } from "../models/types";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
          const c = campaigns[i];
          return (
            <article className="card campaign-card" key={tag}>
              <span className="eyebrow">{tag}</span>
              <h3>{tag}</h3>
              <div className="success-score">
                {c
                  ? Math.round(
                      c.success_score ?? 0,
                    )
                  : 0}
                <small>success score</small>
              </div>
              <MetricLine
                label="Mentions"
                value={(c?.mentions ?? 0).toLocaleString()}
              />
              <MetricLine label="Status" value={c?.status ?? "—"} />
              <MetricLine label="Reach" value={(c?.reach ?? 0).toLocaleString()} />
              <MetricLine label="Conversions" value={(c?.conversions ?? 0).toLocaleString()} />
            </article>
          );
        })}
      </div>
      <article className="card chart-card">
        <h3>Campaign comparison</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={campaigns}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="reach" fill="var(--indigo)" />
            <Bar dataKey="conversions" fill="var(--green)" />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
