import type { Tone } from "../../models/types";

export type FilterBarProps = {
  tone: Tone | "all";
  onToneChange: (tone: Tone | "all") => void;
  visibleCount: number;
  onRefresh: () => void;
};

export function FilterBar({
  tone,
  onToneChange,
  visibleCount,
  onRefresh,
}: FilterBarProps) {
  const tones: Tone[] = ["positive", "neutral", "negative"];

  return (
    <div className="global-bar">
      <div>
        <span className="eyebrow">GLOBAL FILTERS</span>
        <button
          className={`filter ${tone === "all" ? "selected" : ""}`}
          onClick={() => onToneChange("all")}
        >
          All sentiment
        </button>
        {tones.map((t) => (
          <button
            key={t}
            className={`filter ${tone === t ? "selected" : ""}`}
            onClick={() => onToneChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <span className="muted">
        {visibleCount.toLocaleString()} visible signals ·{" "}
        <button className="text-button" onClick={onRefresh}>
          Refresh
        </button>
      </span>
    </div>
  );
}

export type MentionRiskFilter = "all" | "low" | "medium" | "high" | "critical";
export type MentionImpactFilter = "all" | "high" | "medium" | "low";

export type MentionsFilterPanelProps = {
  sourceMentions: import("../../models/types").Mention[];
  platform: string;
  onPlatformChange: (platform: string) => void;
  platforms: string[];
  tone: Tone | "all";
  onToneChange: (tone: Tone | "all") => void;
  risk: MentionRiskFilter;
  onRiskChange: (risk: MentionRiskFilter) => void;
  impact: MentionImpactFilter;
  onImpactChange: (impact: MentionImpactFilter) => void;
};

export function MentionsFilterPanel({
  sourceMentions,
  platform,
  onPlatformChange,
  platforms,
  tone,
  onToneChange,
  risk,
  onRiskChange,
  impact,
  onImpactChange,
}: MentionsFilterPanelProps) {
  const riskOptions: MentionRiskFilter[] = ["all", "low", "medium", "high", "critical"];
  const impactOptions: MentionImpactFilter[] = ["all", "high", "medium", "low"];
  const riskForImpact = (value: number): Exclude<MentionRiskFilter, "all"> =>
    value >= 70 ? "critical" : value >= 60 ? "high" : value >= 40 ? "medium" : "low";
  const impactBucket = (value: number): Exclude<MentionImpactFilter, "all"> =>
    value >= 70 ? "high" : value >= 40 ? "medium" : "low";
  const count = (predicate: (mention: import("../../models/types").Mention) => boolean) =>
    sourceMentions.filter(predicate).length;

  return (
    <div className="filter-panel">
      <span className="eyebrow">FILTERS</span>
      <div className="filter-group">
        <span className="filter-group-label">Platform</span>
        <div className="filter-options">
          <button className={`filter ${platform === "all" ? "selected" : ""}`} onClick={() => onPlatformChange("all")}>
            All platforms ({sourceMentions.length})
          </button>
          {platforms.map((option) => (
            <button className={`filter ${platform === option ? "selected" : ""}`} key={option} onClick={() => onPlatformChange(option)}>
              {option} ({count((mention) => mention.platform === option)})
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-group-label">Sentiment</span>
        <div className="filter-options">
          <button className={`filter ${tone === "all" ? "selected" : ""}`} onClick={() => onToneChange("all")}>All sentiment ({sourceMentions.length})</button>
          {(["positive", "neutral", "negative"] as Tone[]).map((option) => (
            <button className={`filter ${tone === option ? "selected" : ""}`} key={option} onClick={() => onToneChange(option)}>
              {option} ({count((mention) => mention.tone === option)})
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-group-label">Risk</span>
        <div className="filter-options">
          {riskOptions.map((option) => (
            <button className={`filter ${risk === option ? "selected" : ""}`} key={`risk-${option}`} onClick={() => onRiskChange(option)}>
              Risk: {option} ({option === "all" ? sourceMentions.length : count((mention) => riskForImpact(mention.impact) === option)})
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-group-label">Impact</span>
        <div className="filter-options">
          {impactOptions.map((option) => (
            <button className={`filter ${impact === option ? "selected" : ""}`} key={`impact-${option}`} onClick={() => onImpactChange(option)}>
              Impact: {option} ({option === "all" ? sourceMentions.length : count((mention) => impactBucket(mention.impact) === option)})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
