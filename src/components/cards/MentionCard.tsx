import type { Mention } from "../../models/types";

export type MentionCardProps = {
  mention: Mention;
  onClick: () => void;
};

export function MentionCard({ mention, onClick }: MentionCardProps) {
  return (
    <button className="mention-row" onClick={onClick}>
      <span className={`sentiment-dot ${mention.tone}`} />
      <span className="mention-copy">
        <strong>{mention.author}</strong>
        <small>
          {mention.platform} · {mention.topic} · {mention.emotion}
        </small>
        <p>{mention.text}</p>
      </span>
      <span className="impact">
        {mention.impact.toFixed(0)}
        <small>impact</small>
      </span>
    </button>
  );
}

// Keep MentionRow alias for compatibility
export { MentionCard as MentionRow };
