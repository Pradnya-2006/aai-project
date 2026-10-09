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

export function MentionsFilterPanel() {
  return (
    <div className="filter-panel">
      <span className="eyebrow">FILTERS</span>
      <button className="filter selected">All platforms</button>
      <button className="filter selected">All sentiment</button>
      <button className="filter">Risk: all</button>
      <button className="filter">Impact: all</button>
    </div>
  );
}
