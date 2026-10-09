import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api/client";
import type {
  DrawerKind,
  InfluencerMetric,
  Mention,
  TopicMetric,
} from "../../models/types";
import { MetricLine } from "../ui/MetricLine";

function DrawerActions({ mention }: { mention: Mention }) {
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: () => api.drawerGenerateResponse(mention.id, mention.topic),
    onSuccess: (data) => {
      toast.success(data.message || "Draft response generated");
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["responses"] });
    },
    onError: () => toast.error("Failed to generate response"),
  });

  const incidentMutation = useMutation({
    mutationFn: () => api.drawerOpenIncident(mention.id, mention.topic),
    onSuccess: (data) => {
      toast.error(data.message || "Incident opened");
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["risk"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Failed to open incident"),
  });

  const notifyMutation = useMutation({
    mutationFn: () => api.drawerNotifyProductTeam(mention.id, "Product Team"),
    onSuccess: (data) => {
      toast.info(data.message || "Product team notified");
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Failed to notify product team"),
  });

  return (
    <div className="button-row" style={{ marginTop: "14px" }}>
      <button
        className="secondary"
        disabled={generateMutation.isPending}
        onClick={() => generateMutation.mutate()}
      >
        {generateMutation.isPending ? "Generating..." : "Generate Response"}
      </button>
      <button
        className="destructive"
        disabled={incidentMutation.isPending}
        onClick={() => incidentMutation.mutate()}
      >
        {incidentMutation.isPending ? "Escalating..." : "Open Incident"}
      </button>
      <button
        className="secondary"
        disabled={notifyMutation.isPending}
        onClick={() => notifyMutation.mutate()}
      >
        {notifyMutation.isPending ? "Notifying..." : "Notify Product Team"}
      </button>
    </div>
  );
}


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
          <DrawerActions mention={mention} />
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
