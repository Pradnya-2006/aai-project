import type {
  AuditLogEntry,
  AgentMetric,
  CampaignMetric,
  CompetitorMetric,
  CrisisSimulation,
  ExecutiveMetric,
  InfluencerMetric,
  Mention,
  NotificationItem,
  OrchestratorRun,
  ResponseDraft,
  GeneratedResponse,
  ReplyTone,
  ResponseVersion,
  RiskMetric,
  SimulatorState,
  Summary,
  TopicMetric,
} from "../models/types";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let errorDetail = `API request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body.detail) errorDetail = body.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listMentions: async () => {
    const batches = await Promise.all([
      request<Mention[]>("/api/mentions?limit=1000"),
      request<Mention[]>("/api/mentions?limit=1000&tone=positive"),
      request<Mention[]>("/api/mentions?limit=1000&tone=negative"),
    ]);
    return Array.from(
      new Map(batches.flat().map((mention) => [mention.id, mention])).values(),
    );
  },
  getSummary: () => request<Summary>("/api/summary"),
  listTopics: () => request<TopicMetric[]>("/api/topics"),
  getRisk: () => request<RiskMetric>("/api/risk"),
  listInfluencers: () => request<InfluencerMetric[]>("/api/influencers"),
  listCampaigns: () => request<CampaignMetric[]>("/api/campaigns"),
  getExecutive: () => request<ExecutiveMetric[]>("/api/executive"),
  listCompetitors: () => request<CompetitorMetric[]>("/api/competitors"),
  listAgents: () => request<AgentMetric[]>("/api/agents"),
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

  // Responses
  listResponses: () => request<ResponseDraft[]>("/api/responses"),
  getResponse: (id = 1) => request<ResponseDraft>(`/api/responses/${id}`),
  approveResponse: (id = 1) =>
    request<{ approved: boolean; status: "approved" }>(
      `/api/responses/${id}/approve`,
      { method: "POST" },
    ),
  rejectResponse: (id = 1, reason = "Draft rejected by reviewer") =>
    request<ResponseDraft>(`/api/responses/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),
  regenerateResponse: (id = 1) =>
    request<ResponseDraft>(`/api/responses/${id}/regenerate`, {
      method: "POST",
    }),
  editResponse: (id = 1, body: string) =>
    request<ResponseDraft>(`/api/responses/${id}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }),
  publishResponse: (id = 1) =>
    request<ResponseDraft>(`/api/responses/${id}/publish`, {
      method: "POST",
    }),
  bulkApproveResponses: (ids?: number[]) =>
    request<{ approved: boolean; count: number; ids: number[] }>(
      "/api/responses/bulk-approve",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      },
    ),
  resetDemoResponses: () =>
    request<{ reset: number }>("/api/responses/reset-demo", { method: "POST" }),
  generateResponse: (payload: {
    comment: string;
    sentiment: Mention["tone"];
    emotion?: Mention["emotion"];
    topic: string;
    risk?: string;
    brand_name: string;
    tone: ReplyTone;
    platform?: string;
    response_id: number;
  }) =>
    request<GeneratedResponse>("/api/responses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  getResponseVersions: (id = 1) =>
    request<ResponseVersion[]>(`/api/responses/${id}/versions`),
  getResponseAudit: (id = 1) =>
    request<AuditLogEntry[]>(`/api/responses/${id}/audit`),
  getGlobalAuditLog: () => request<AuditLogEntry[]>("/api/audit-log"),

  // Notifications
  listNotifications: () => request<NotificationItem[]>("/api/notifications"),
  markNotificationsRead: () =>
    request<{ success: boolean }>("/api/notifications/read", {
      method: "POST",
    }),
  markNotificationRead: (id: number) =>
    request<{ success: boolean; id: number }>(`/api/notifications/${id}/read`, {
      method: "POST",
    }),

  // Drawer actions
  drawerGenerateResponse: (mention_id?: number, topic?: string) =>
    request<{ success: boolean; message: string; response_plan?: string; topic?: string }>(
      "/api/drawer/generate-response",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mention_id, topic }),
      },
    ),
  drawerOpenIncident: (mention_id?: number, topic?: string) =>
    request<{ success: boolean; incident_open: boolean; message: string; incident_id?: string; topic?: string }>(
      "/api/drawer/open-incident",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mention_id, topic }),
      },
    ),
  drawerNotifyProductTeam: (mention_id?: number, team?: string) =>
    request<{ success: boolean; message: string }>(
      "/api/drawer/notify-product-team",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mention_id, team }),
      },
    ),
};
