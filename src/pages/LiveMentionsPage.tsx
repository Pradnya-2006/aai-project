import { CardHead } from "../components/cards/CardHead";
import { MentionCard } from "../components/cards/MentionCard";
import { EmptyState } from "../components/feedback/EmptyState";
import {
  MentionsFilterPanel,
  type MentionImpactFilter,
  type MentionRiskFilter,
} from "../components/ui/FilterBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Mention } from "../models/types";

export type LiveMentionsPageProps = {
  mentions: Mention[];
  allMentions: Mention[];
  onMention: (m: Mention) => void;
  platform: string;
  onPlatformChange: (platform: string) => void;
  platforms: string[];
  tone: "all" | Mention["tone"];
  onToneChange: (tone: "all" | Mention["tone"]) => void;
  risk: MentionRiskFilter;
  onRiskChange: (risk: MentionRiskFilter) => void;
  impact: MentionImpactFilter;
  onImpactChange: (impact: MentionImpactFilter) => void;
};

export default function LiveMentionsPage({
  mentions,
  allMentions,
  onMention,
  platform,
  onPlatformChange,
  platforms,
  tone,
  onToneChange,
  risk,
  onRiskChange,
  impact,
  onImpactChange,
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

      <MentionsFilterPanel
        sourceMentions={allMentions}
        platform={platform}
        onPlatformChange={onPlatformChange}
        platforms={platforms}
        tone={tone}
        onToneChange={onToneChange}
        risk={risk}
        onRiskChange={onRiskChange}
        impact={impact}
        onImpactChange={onImpactChange}
      />

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
