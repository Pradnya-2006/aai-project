import { Zap } from "lucide-react";
import type { OrchestratorRun } from "../../models/types";
import { CardHead } from "./CardHead";

export type AgentPipelineProps = {
  analysis: OrchestratorRun | null;
  onAgent: (agentName: string) => void;
};

const AGENT_STAGES = [
  "Collect",
  "Classify",
  "Sentiment",
  "Influence",
  "Trend",
  "Risk",
  "Recommend",
  "Approve",
];

export function AgentPipeline({ analysis, onAgent }: AgentPipelineProps) {
  return (
    <article className="card">
      <CardHead
        title="Agent pipeline"
        help="Click an agent to inspect measured output."
        actions={
          <span className="status-pill healthy">
            <span className="pulse" />
            {analysis ? "processing complete" : "ready"}
          </span>
        }
      />
      <div className="pipeline">
        {AGENT_STAGES.map((a, i) => (
          <button
            className="pipeline-agent"
            key={a}
            onClick={() => onAgent(a)}
          >
            <span
              className={`pipeline-node ${
                analysis && i < analysis.nodes.length ? "complete" : ""
              }`}
            >
              {i + 1}
            </span>
            <small>{a}</small>
            {i < AGENT_STAGES.length - 1 && <i />}
          </button>
        ))}
      </div>
      <div className="orchestrator">
        <Zap size={15} />
        <strong>Master Orchestrator</strong>
        <span>
          {analysis
            ? `${analysis.alert_level} · ${analysis.nodes.length} timed nodes`
            : "Awaiting signal run"}
        </span>
      </div>
    </article>
  );
}
