import { CardHead } from "../components/cards/CardHead";
import { MentionCard } from "../components/cards/MentionCard";
import { EmptyState } from "../components/feedback/EmptyState";
import { MentionsFilterPanel } from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Mention } from "../models/types";

export type LiveMentionsPageProps = {
  mentions: Mention[];
  onMention: (m: Mention) => void;
};

export default function LiveMentionsPage({
  mentions,
  onMention,
}: LiveMentionsPageProps) {
  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">SIGNAL STREAM</span>
          <h2>Live Mentions</h2>
          <p className="subhead">
            Every signal is classified, scored, and ready for action.
          </p>
        </div>
        <StatusBadge variant="healthy" pulse>
          live stream
        </StatusBadge>
      </div>

      <MentionsFilterPanel />

      <div className="card">
        <CardHead
          title={`${mentions.length.toLocaleString()} classified mentions`}
          help="Click a signal for author intelligence and response actions."
        />
        <div className="mention-list">
          {mentions.length ? (
            mentions.map((m) => (
              <MentionCard
                key={m.id}
                mention={m}
                onClick={() => onMention(m)}
              />
            ))
          ) : (
            <EmptyState title="No mentions match the current filters." />
          )}
        </div>
      </div>
    </div>
  );
}
