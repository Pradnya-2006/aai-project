import type { TopicMetric } from "../../models/types";

export type TopicCardProps = {
  topic: TopicMetric;
  rank?: number;
  onClick?: () => void;
};

export function TopicCard({ topic, rank, onClick }: TopicCardProps) {
  return (
    <button className="rank-row" onClick={onClick}>
      {rank !== undefined && <b>{String(rank).padStart(2, "0")}</b>}
      <span>
        <strong>{topic.name}</strong>
        <small>
          {topic.negative_pct}% negative · {topic.velocity}
        </small>
      </span>
      <em>{topic.mentions.toLocaleString()}</em>
    </button>
  );
}

export type TopicBubbleProps = {
  topic: TopicMetric;
  index: number;
  onClick?: () => void;
};

export function TopicBubble({ topic, index, onClick }: TopicBubbleProps) {
  const size = 70 + Math.min(100, topic.mentions / 12);
  const left = 10 + ((index * 23) % 75);
  const top = 12 + ((index * 31) % 68);

  return (
    <button
      className={`topic-bubble ${topic.negative_pct > 60 ? "risk" : ""}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        top: `${top}%`,
      }}
      onClick={onClick}
    >
      {topic.name}
      <small>{topic.mentions.toLocaleString()}</small>
    </button>
  );
}
