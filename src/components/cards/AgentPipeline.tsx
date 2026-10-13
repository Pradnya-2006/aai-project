import { Zap } from "lucide-react";
import type { AgentMetric, OrchestratorRun } from "../../models/types";
import { CardHead } from "./CardHead";

export type AgentPipelineProps = {
  analysis: OrchestratorRun | null;
  agents: AgentMetric[];
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

export function AgentPipeline({ analysis, agents, onAgent }: AgentPipelineProps) {
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
        {(agents.length ? agents.slice(0, 8) : AGENT_STAGES.map((name) => ({ name, status: "IDLE" as const, processed_count: 0, last_output: "" }))).map((agent, i) => (
          <button
            className="pipeline-agent"
            key={agent.name}
            title={`${agent.status} · ${agent.processed_count.toLocaleString()} processed`}
            onClick={() => onAgent(agent.name)}
          >
            <span
              className={`pipeline-node ${
                analysis && i < analysis.nodes.length ? "complete" : ""
              }`}
            >
              {i + 1}
            </span>
            <small>{agent.name}</small>
            <small>{agent.status} · {agent.processed_count.toLocaleString()}</small>
            {i < 7 && <i />}
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
