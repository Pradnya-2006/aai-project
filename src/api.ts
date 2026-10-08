export type Tone = "positive" | "negative" | "neutral";

export type Mention = {
  id: number;
  author: string;
  platform: string;
  text: string;
  tone: Tone;
  mention_type: "complaint" | "question" | "praise" | "feature request" | "bug report" | "comparison";
  emotion: "angry" | "frustrated" | "confused" | "disappointed" | "excited" | "happy";
  intensity: number;
  impact: number;
  topic: string;
  time: string;
};

export type Summary = {
  mentions: number;
  negative_sentiment: number;
  brand_health: number;
  open_risks: number;
  positive_mentions: number;
  neutral_mentions: number;
};

export type TopicMetric = {
  name: string;
  mentions: number;
  growth: number;
  negative_pct: number;
  velocity: "Low" | "Medium" | "High" | "Very High";
};

export type RiskMetric = {
  cluster: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  growth_pct: number;
  negative_pct: number;
  z_score: number;
  baseline: number;
  action: string;
  predicted_risk: number;
  predicted_peak: number;
  baseline_frozen: boolean;
};

export type InfluencerMetric = { name: string; platform: string; followers: number; mentions: number; engagement: number; sentiment: Tone; impact: number };
export type CampaignMetric = { name: string; mentions: number; positive_pct: number; engagement: number; status: "On track" | "Needs attention" | "At risk" };
export type ExecutiveMetric = { headline: string; value: string; detail: string; tone: "positive" | "negative" | "neutral" | "critical" };
export type CrisisSimulation = { severity: "Low" | "Medium" | "High" | "Critical"; duration_hours: number; projected_negative_pct: number; projected_mentions: number; recommended_action: string };
export type CompetitorMetric = { name: string; mentions: number; share_of_voice: number; negative_pct: number; brand_health: number };
export type OrchestratorRun = { run_id: string; status: "completed" | "interrupted" | "failed"; alert_level: "NORMAL" | "ANOMALY" | "SPIKE" | "HIGH RISK" | "CRITICAL"; recommendation: string; nodes: { name: string; duration_ms: number; status: string }[]; interrupt_reason?: string | null };
export type SimulatorState = { status: "idle" | "running" | "paused" | "completed"; hour: number; speed: number; stage: string; inserted: number };

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) throw new Error(`API request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export const api = {
  listMentions: () => request<Mention[]>("/api/mentions"),
  getSummary: () => request<Summary>("/api/summary"),
  listTopics: () => request<TopicMetric[]>("/api/topics"),
  getRisk: () => request<RiskMetric>("/api/risk"),
  listInfluencers: () => request<InfluencerMetric[]>("/api/influencers"),
  listCampaigns: () => request<CampaignMetric[]>("/api/campaigns"),
  getExecutive: () => request<ExecutiveMetric[]>("/api/executive"),
  listCompetitors: () => request<CompetitorMetric[]>("/api/competitors"),
  runAnalysis: () => request<OrchestratorRun>("/api/analysis/run", { method: "POST" }),
  simulateCrisis: (severity: CrisisSimulation["severity"]) => request<CrisisSimulation>("/api/crisis/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ severity, duration_hours: 24 }) }),
  simulateMention: () => request<Mention>("/api/mentions/simulate", { method: "POST" }),
  crisisState: () => request<SimulatorState>("/api/crisis/state"),
  crisisStart: (speed: number) => request<SimulatorState>(`/api/crisis/start?speed=${speed}`, { method: "POST" }),
  crisisPause: () => request<SimulatorState>("/api/crisis/pause", { method: "POST" }),
  crisisReset: () => request<SimulatorState>("/api/crisis/reset", { method: "POST" }),
  crisisTick: () => request<SimulatorState>("/api/crisis/tick", { method: "POST" }),
  approveResponse: () => request<{ approved: boolean; status: "approved" }>("/api/responses/1/approve", { method: "POST" }),
};
