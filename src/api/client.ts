import type {
  CampaignMetric,
  CompetitorMetric,
  CrisisSimulation,
  ExecutiveMetric,
  InfluencerMetric,
  Mention,
  OrchestratorRun,
  RiskMetric,
  SimulatorState,
  Summary,
  TopicMetric,
} from "../models/types";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  runAnalysis: () =>
    request<OrchestratorRun>("/api/analysis/run", { method: "POST" }),
  simulateCrisis: (severity: CrisisSimulation["severity"]) =>
    request<CrisisSimulation>("/api/crisis/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ severity, duration_hours: 24 }),
    }),
  simulateMention: () =>
    request<Mention>("/api/mentions/simulate", { method: "POST" }),
  crisisState: () => request<SimulatorState>("/api/crisis/state"),
  crisisStart: (speed: number) =>
    request<SimulatorState>(`/api/crisis/start?speed=${speed}`, {
      method: "POST",
    }),
  crisisPause: () =>
    request<SimulatorState>("/api/crisis/pause", { method: "POST" }),
  crisisReset: () =>
    request<SimulatorState>("/api/crisis/reset", { method: "POST" }),
  crisisTick: () =>
    request<SimulatorState>("/api/crisis/tick", { method: "POST" }),
  approveResponse: () =>
    request<{ approved: boolean; status: "approved" }>(
      "/api/responses/1/approve",
      { method: "POST" },
    ),
};
