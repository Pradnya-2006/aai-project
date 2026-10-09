import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { NAV, iconFor, type NavItem } from "../../utils/navigation";

export type SidebarProps = {
  active: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  demo: boolean;
  onToggleDemo: () => void;
  onNavigate: (route: string) => void;
};

export function Sidebar({
  active,
  collapsed,
  onToggleCollapse,
  dark,
  onToggleTheme,
  demo,
  onToggleDemo,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <div className="brand-mark">A</div>
        {!collapsed && (
          <div>
            <strong>ACME / AI</strong>
            <span>BRAND INTELLIGENCE</span>
          </div>
        )}
      </div>

      <button
        className="sidebar-toggle ghost"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
      >
        <Menu size={16} />
      </button>

      <nav aria-label="Primary navigation">
        {NAV.map((item: NavItem) => {
          const Icon = iconFor(item);
          return (
            <button
              key={item}
              className={`nav-item ${active === item ? "active" : ""}`}
              aria-label={item}
              title={item}
              onClick={() => onNavigate(item)}
            >
              <Icon size={17} />
              {!collapsed && <span>{item}</span>}
              {item === "Response Studio" && !collapsed && (
                <b className="nav-badge">3</b>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          aria-label={dark ? "Light theme" : "Dark theme"}
          onClick={onToggleTheme}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span>{dark ? "Light theme" : "Dark theme"}</span>}
        </button>

        <button
          className="nav-item"
          aria-label="Toggle demo mode"
          onClick={onToggleDemo}
        >
          <Sparkles size={17} />
          {!collapsed && <span>Data mode: {demo ? "Demo" : "Live"}</span>}
        </button>
      </div>
    </aside>
  );
}
