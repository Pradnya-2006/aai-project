import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import type {
  DrawerKind,
  InfluencerMetric,
  Mention,
  TopicMetric,
} from "../../models/types";
import { MetricLine } from "../ui/MetricLine";

export type DrawerProps = {
  kind: DrawerKind;
  mention: Mention | null;
  agent: string | null;
  topic?: TopicMetric;
  influencer?: InfluencerMetric;
  onClose: () => void;
};

export function Drawer({
  kind,
  mention,
  agent,
  topic,
  influencer,
  onClose,
}: DrawerProps) {
  if (!kind) return null;

  return (
    <motion.aside
      className="drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
    >
      <div className="drawer-head">
        <span className="eyebrow">{kind.toUpperCase()} DETAIL</span>
        <button
          className="icon-button"
          aria-label="Close drawer"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {kind === "mention" && mention && (
        <>
          <h2>{mention.author}</h2>
          <p className="subhead">{mention.text}</p>
          <div className="drawer-grid">
            <MetricLine label="Classification" value={mention.mention_type} />
            <MetricLine label="Emotion" value={mention.emotion} />
            <MetricLine label="Topic" value={mention.topic} />
            <MetricLine label="Impact" value={mention.impact.toFixed(1)} />
            <MetricLine
              label="Intensity"
              value={mention.intensity.toFixed(2)}
            />
          </div>
          <div className="action-box">
            <span className="eyebrow">AI RECOMMENDATION</span>
            <strong>
              Escalate to the response team and prepare a governed reply.
            </strong>
          </div>
          <div className="button-row">
            <button
              className="secondary"
              onClick={() => toast.info("Draft response generated")}
            >
              Generate
            </button>
            <button
              className="primary"
              onClick={() => toast.success("Signal response approved")}
            >
              Approve
            </button>
            <button
              className="destructive"
              onClick={() => toast.error("Incident opened")}
            >
              Open incident
            </button>
          </div>
        </>
      )}

      {kind === "agent" && (
        <>
          <h2>{agent} agent</h2>
          <p className="subhead">
            Current task and measured output distribution.
          </p>
          <div className="drawer-grid">
            <MetricLine label="Accuracy" value="94%" />
            <MetricLine label="Last run" value="Just now" />
            <MetricLine label="Task" value="Classify signal" />
          </div>
          <div className="output-bars">
            <span style={{ width: "72%" }}>negative 72%</span>
            <span style={{ width: "20%" }}>neutral 20%</span>
            <span style={{ width: "8%" }}>positive 8%</span>
          </div>
        </>
      )}

      {kind === "topic" && topic && (
        <>
          <h2>{topic.name}</h2>
          <MetricLine label="Volume" value={topic.mentions.toLocaleString()} />
          <MetricLine label="Growth" value={`${topic.growth}%`} />
        </>
      )}

      {kind === "influencer" && influencer && (
        <>
          <h2>{influencer.name}</h2>
          <MetricLine
            label="Followers"
            value={influencer.followers.toLocaleString()}
          />
          <MetricLine label="Impact" value={influencer.impact.toFixed(1)} />
        </>
      )}
    </motion.aside>
  );
}
