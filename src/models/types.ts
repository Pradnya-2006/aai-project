export type Tone = "positive" | "negative" | "neutral";

export type MentionType =
  | "complaint"
  | "question"
  | "praise"
  | "feature request"
  | "bug report"
  | "comparison";

export type Emotion =
  | "angry"
  | "frustrated"
  | "confused"
  | "disappointed"
  | "excited"
  | "happy";

export type Mention = {
  id: number;
  author: string;
  platform: string;
  text: string;
  tone: Tone;
  mention_type: MentionType;
  emotion: Emotion;
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

export type RiskSeverity = "Low" | "Medium" | "High" | "Critical";

export type RiskMetric = {
  cluster: string;
  severity: RiskSeverity;
  growth_pct: number;
  negative_pct: number;
  z_score: number;
  baseline: number;
  action: string;
  predicted_risk: number;
  predicted_peak: number;
  baseline_frozen: boolean;
};

export type InfluencerMetric = {
  name: string;
  platform: string;
  followers: number;
  mentions: number;
  engagement: number;
  sentiment: Tone;
  impact: number;
};

export type CampaignMetric = {
  name: string;
  mentions: number;
  positive_pct: number;
  engagement: number;
  status: "On track" | "Needs attention" | "At risk";
};

export type ExecutiveMetric = {
  headline: string;
  value: string;
  detail: string;
  tone: "positive" | "negative" | "neutral" | "critical";
};

export type CrisisSimulation = {
  severity: RiskSeverity;
  duration_hours: number;
  projected_negative_pct: number;
  projected_mentions: number;
  recommended_action: string;
};

export type CompetitorMetric = {
  name: string;
  mentions: number;
  share_of_voice: number;
  negative_pct: number;
  brand_health: number;
};

export type PipelineNode = {
  name: string;
  duration_ms: number;
  status: string;
};

export type OrchestratorRun = {
  run_id: string;
  status: "completed" | "interrupted" | "failed";
  alert_level: "NORMAL" | "ANOMALY" | "SPIKE" | "HIGH RISK" | "CRITICAL";
  recommendation: string;
  nodes: PipelineNode[];
  interrupt_reason?: string | null;
};

export type SimulatorState = {
  status: "idle" | "running" | "paused" | "completed";
  hour: number;
  speed: number;
  stage: string;
  inserted: number;
};

export type ChartPoint = {
  name: string;
  mentions: number;
  negative: number;
};

export type DrawerKind = "mention" | "agent" | "topic" | "influencer" | null;
