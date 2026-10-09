import { Bell, Check, Command, Search } from "lucide-react";
import { useState } from "react";
import type { NotificationItem } from "../../models/types";

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
  notifications?: NotificationItem[];
  unreadCount?: number;
  onMarkAllNotificationsRead?: () => void;
  onNotificationClick?: (notif: NotificationItem) => void;
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
  notifications = [],
  unreadCount = 0,
  onMarkAllNotificationsRead,
  onNotificationClick,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

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
        <div className="notification-wrap">
          <button
            className={`icon-button ${showNotifications ? "selected" : ""}`}
            aria-label="Toggle notifications"
            onClick={() => setShowNotifications((v) => !v)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="unread-badge"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div
              className="notification-popover"
              role="dialog"
              aria-label="Notifications panel"
            >
              <div className="notification-popover-head">
                <div>
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <span className="muted"> ({unreadCount} unread)</span>
                  )}
                </div>
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    className="text-button"
                    style={{ fontSize: "11px" }}
                    onClick={onMarkAllNotificationsRead}
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div
                    className="muted"
                    style={{ padding: "16px", textAlign: "center" }}
                  >
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      className={`notification-item ${
                        n.read ? "read" : "unread"
                      }`}
                      onClick={() => {
                        onNotificationClick?.(n);
                        setShowNotifications(false);
                      }}
                    >
                      <div className="notification-item-head">
                        <span
                          className={`kind-pill kind-${n.kind.toLowerCase()}`}
                        >
                          {n.kind}
                        </span>
                        {!n.read && <span className="unread-dot" />}
                      </div>
                      <strong>{n.title}</strong>
                      <p>{n.body}</p>
                      {n.route && (
                        <small className="notification-route">
                          Go to {n.route} →
                        </small>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <span className="live-dot">● {demo ? "DEMO" : "LIVE"}</span>
      </div>
    </header>
  );
}

