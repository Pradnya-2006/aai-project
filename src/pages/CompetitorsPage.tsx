import { MetricLine } from "../components/ui/MetricLine";
import type { CompetitorMetric } from "../models/types";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
      <article className="card chart-card">
        <h3>Positive vs negative sentiment</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={competitors.map((c) => ({ name: c.name, positive: Math.max(0, 100 - c.negative_pct), negative: c.negative_pct }))}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => `${Math.round(Number(value))}%`} />
            <Legend />
            <Bar dataKey="positive" fill="var(--green)" name="Positive" />
            <Bar dataKey="negative" fill="var(--red)" name="Negative" />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
