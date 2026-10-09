import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { ApprovalCard } from "../components/cards/ApprovalCard";
import { CardHead } from "../components/cards/CardHead";
import { MetricLine } from "../components/ui/MetricLine";

export type ResponseStudioPageProps = {
  onNavigate: (p: string) => void;
};

export default function ResponseStudioPage({
  onNavigate,
}: ResponseStudioPageProps) {
  const [tab, setTab] = useState("Pending");
  const [approved, setApproved] = useState(false);
  const [simulation, setSimulation] = useState(
    "Simulation ready · mentions will be projected from current data",
  );

  const handleApprove = () => {
    api
      .approveResponse()
      .then(() => {
        setApproved(true);
        toast.success("Response approved and unlocked for publishing");
      })
      .catch(() => toast.error("Failed to approve response"));
  };

  const handlePublish = () => {
    toast.success("Response published to channels");
    onNavigate("Response Studio");
  };

  const handleSimulate = () => {
    api
      .simulateCrisis("High")
      .then((d) => {
        setSimulation(
          `${d.projected_mentions.toLocaleString()} mentions · ${d.projected_negative_pct}% negative`,
        );
        toast.success("Escalation model simulation completed");
      })
      .catch(() => toast.error("Simulation failed"));
  };

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">GOVERNED RESPONSE</span>
          <h2>Response Studio</h2>
          <p className="subhead">
            Draft, review, and publish with an explicit approval gate.
          </p>
        </div>
      </div>

      <div className="tabs">
        {["Pending", "Approved", "Rejected", "Published"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="response-layout">
        <ApprovalCard
          approved={approved}
          onApprove={handleApprove}
          onRegenerate={() => toast.info("New variation generated")}
          onReject={() => toast.error("Draft marked as rejected")}
        />

        <article className="card">
          <CardHead
            title="Audit trail"
            help="Every transition is recorded by the backend."
          />
          <div className="audit">
            <MetricLine label="Created" value="Response Generation" />
            <MetricLine label="Review" value="Alex Rivera" />
            <MetricLine
              label="Publish gate"
              value={approved ? "Unlocked" : "Locked until APPROVED"}
            />
          </div>
          <button
            className="primary full"
            disabled={!approved}
            title={approved ? "Publish response" : "Approve before publishing"}
            onClick={handlePublish}
          >
            Publish response
          </button>
        </article>
      </div>

      <div className="card crisis-inline">
        <span className="eyebrow">CRISIS SIMULATOR</span>
        <h3>Need to model escalation?</h3>
        <button className="primary" onClick={handleSimulate}>
          Run simulation
        </button>
        <button
          className="text-button"
          onClick={() => onNavigate("Crisis Ops")}
        >
          Open Crisis Ops <ChevronRight size={13} />
        </button>
        {simulation && (
          <span className="simulation-result muted">{simulation}</span>
        )}
      </div>
    </div>
  );
}
