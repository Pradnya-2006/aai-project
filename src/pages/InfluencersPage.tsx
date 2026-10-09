import { CardHead } from "../components/cards/CardHead";
import type { InfluencerMetric } from "../models/types";

export type InfluencersPageProps = {
  influencers: InfluencerMetric[];
};

export default function InfluencersPage({ influencers }: InfluencersPageProps) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">INFLUENCE GRAPH</span>
          <h2>Influencers</h2>
          <p className="subhead">
            Reach weighted by engagement, verification, and sentiment
            intensity.
          </p>
        </div>
      </div>

      <div className="card table-card">
        <CardHead
          title="Top-impact voices"
          help="High-reach negative voices are highlighted."
        />
        <div className="table-head">
          <span>Author</span>
          <span>Platform</span>
          <span>Followers</span>
          <span>Sentiment</span>
          <span>Impact</span>
        </div>
        {influencers.map((i) => (
          <button
            className={`table-row ${
              i.followers > 100000 && i.sentiment === "negative"
                ? "attention"
                : ""
            }`}
            key={i.name}
            onClick={() => undefined}
          >
            <strong>{i.name}</strong>
            <span>{i.platform}</span>
            <span>{i.followers.toLocaleString()}</span>
            <span className={i.sentiment}>{i.sentiment}</span>
            <b>{i.impact.toFixed(1)}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
