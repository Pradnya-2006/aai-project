import { Bell, Command, Search } from "lucide-react";
import { toast } from "sonner";

export type TopbarProps = {
  active: string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  platform: string;
  onPlatformChange: (platform: string) => void;
  platforms: string[];
  query: string;
  onQueryChange: (query: string) => void;
  presentation: boolean;
  onTogglePresentation: () => void;
  demo: boolean;
};

export function Topbar({
  active,
  timeRange,
  onTimeRangeChange,
  platform,
  onPlatformChange,
  platforms,
  query,
  onQueryChange,
  presentation,
  onTogglePresentation,
  demo,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="crumb">
        <span>WORKSPACE / ACME</span>
        <h1>{active}</h1>
      </div>
      <div className="top-actions">
        <select
          aria-label="Time range"
          className="filter"
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
        >
          <option>24H</option>
          <option>7D</option>
          <option>30D</option>
        </select>
        <select
          aria-label="Platform filter"
          className="filter"
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value)}
        >
          <option value="all">All platforms</option>
          {platforms.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <div className="search-wrap">
          <Search size={15} />
          <input
            aria-label="Search mentions"
            placeholder="Search mentions..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <kbd>⌘K</kbd>
        </div>
        <button
          className={`icon-button ${presentation ? "selected" : ""}`}
          aria-label="Toggle presentation mode"
          onClick={onTogglePresentation}
        >
          <Command size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Toggle notifications"
          onClick={() => toast.info("No unread alerts")}
        >
          <Bell size={16} />
        </button>
        <span className="live-dot">● {demo ? "DEMO" : "LIVE"}</span>
      </div>
    </header>
  );
}
