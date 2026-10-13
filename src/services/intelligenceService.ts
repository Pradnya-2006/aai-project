import { api } from "../api/client";
import type {
  CampaignMetric,
  AgentMetric,
  CompetitorMetric,
  CrisisSimulation,
  ExecutiveMetric,
  InfluencerMetric,
  Mention,
  OrchestratorRun,
  RiskMetric,
  RiskSeverity,
  SimulatorState,
  Summary,
  TopicMetric,
} from "../models/types";

export type WorkspaceData = {
  mentions: Mention[];
  summary: Summary;
  topics: TopicMetric[];
  risk: RiskMetric;
  influencers: InfluencerMetric[];
  campaigns: CampaignMetric[];
  executive: ExecutiveMetric[];
  competitors: CompetitorMetric[];
  agents: AgentMetric[];
};

export const intelligenceService = {
  async fetchWorkspaceData(timeoutMs = 15000): Promise<WorkspaceData> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Workspace data request timeout")), timeoutMs),
    );

    const dataPromise = Promise.all([
      api.listMentions(),
      api.getSummary(),
      api.listTopics(),
      api.getRisk(),
      api.listInfluencers(),
      api.listCampaigns(),
      api.getExecutive(),
      api.listCompetitors(),
      api.listAgents(),
    ]).then(([mentions, summary, topics, risk, influencers, campaigns, executive, competitors, agents]) => ({
      mentions,
      summary,
      topics,
      risk,
      influencers,
      campaigns,
      executive,
      competitors,
      agents,
    }));

    return Promise.race([dataPromise, timeout]);
  },

  async runAnalysis(): Promise<OrchestratorRun> {
    return api.runAnalysis();
  },

  async approveResponse(): Promise<{ approved: boolean; status: "approved" }> {
    return api.approveResponse();
  },

  async simulateCrisis(severity: RiskSeverity): Promise<CrisisSimulation> {
    return api.simulateCrisis(severity);
  },

  async getCrisisState(): Promise<SimulatorState> {
    return api.crisisState();
  },

  async startCrisis(speed: number): Promise<SimulatorState> {
    return api.crisisStart(speed);
  },

  async pauseCrisis(): Promise<SimulatorState> {
    return api.crisisPause();
  },

  async resetCrisis(): Promise<SimulatorState> {
    return api.crisisReset();
  },

  async tickCrisis(): Promise<SimulatorState> {
    return api.crisisTick();
  },
};
