import {
  Activity,
  BarChart3,
  FileText,
  Gauge,
  Globe2,
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

export const NAV = [
  "Command Center",
  "Live Mentions",
  "Topics & Trends",
  "Risk Center",
  "Competitors",
  "Influencers",
  "Campaigns",
  "Response Studio",
  "Crisis Ops",
  "Executive Intelligence",
] as const;

export type NavItem = (typeof NAV)[number];

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  "Command Center": LayoutDashboard,
  "Live Mentions": Inbox,
  "Topics & Trends": BarChart3,
  "Risk Center": ShieldAlert,
  Competitors: Globe2,
  Influencers: Users,
  Campaigns: Target,
  "Response Studio": FileText,
  "Crisis Ops": Zap,
  "Executive Intelligence": Gauge,
};

export function iconFor(name: string) {
  return ICON_MAP[name] ?? Activity;
}
