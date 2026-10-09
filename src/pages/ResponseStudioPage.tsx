import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ChevronRight, History, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { ApprovalCard } from "../components/cards/ApprovalCard";
import { CardHead } from "../components/cards/CardHead";
import { GlobalAuditView } from "../components/cards/GlobalAuditView";
import { MetricLine } from "../components/ui/MetricLine";
import type { AuditLogEntry, ResponseDraft } from "../models/types";

export type ResponseStudioPageProps = {
  onNavigate: (p: string) => void;
};

const DEFAULT_DRAFT: ResponseDraft = {
  id: 1,
  topic: "Login Issues",
  body: "We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly.",
  status: "PENDING_REVIEW",
  updated_at: new Date().toISOString(),
  versions_count: 1,
};

export default function ResponseStudioPage({
  onNavigate,
}: ResponseStudioPageProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Pending");
  const [selectedId, setSelectedId] = useState(1);
  const [simulation, setSimulation] = useState(
    "Simulation ready · mentions will be projected from current data",
  );

  // Queries
  const { data: responses = [DEFAULT_DRAFT] } = useQuery({
    queryKey: ["responses"],
    queryFn: api.listResponses,
    placeholderData: [DEFAULT_DRAFT],
  });

  const activeDraft = useMemo(
    () => responses.find((r) => r.id === selectedId) ?? responses[0] ?? DEFAULT_DRAFT,
    [responses, selectedId],
  );

  const { data: responseAudit = [] } = useQuery({
    queryKey: ["responses", activeDraft.id, "audit"],
    queryFn: () => api.getResponseAudit(activeDraft.id),
  });

  const { data: globalAudit = [] } = useQuery({
    queryKey: ["audit-log"],
    queryFn: api.getGlobalAuditLog,
    enabled: tab === "Global Audit",
  });

  // Mutations with Optimistic Updates & Rollbacks
  const approveMutation = useMutation({
    mutationFn: () => api.approveResponse(activeDraft.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["responses"] });
      const previousResponses = queryClient.getQueryData<ResponseDraft[]>(["responses"]);
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) =>
          d.id === activeDraft.id ? { ...d, status: "APPROVED" } : d,
        ),
      );
      return { previousResponses };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousResponses) {
        queryClient.setQueryData(["responses"], context.previousResponses);
      }
      toast.error("Failed to approve response. Rolled back.");
    },
    onSuccess: () => {
      toast.success("Response approved and unlocked for publishing");
      queryClient.invalidateQueries({ queryKey: ["responses", activeDraft.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.rejectResponse(activeDraft.id, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["responses"] });
      const previousResponses = queryClient.getQueryData<ResponseDraft[]>(["responses"]);
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) =>
          d.id === activeDraft.id ? { ...d, status: "REJECTED" } : d,
        ),
      );
      return { previousResponses };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousResponses) {
        queryClient.setQueryData(["responses"], context.previousResponses);
      }
      toast.error("Failed to reject response. Rolled back.");
    },
    onSuccess: () => {
      toast.error("Draft marked as rejected");
      queryClient.invalidateQueries({ queryKey: ["responses", activeDraft.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateResponse(activeDraft.id),
    onSuccess: (updated) => {
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) => (d.id === activeDraft.id ? updated : d)),
      );
      toast.info("New variation generated");
      queryClient.invalidateQueries({ queryKey: ["responses", activeDraft.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: () => toast.error("Failed to regenerate response"),
  });

  const editMutation = useMutation({
    mutationFn: (body: string) => api.editResponse(activeDraft.id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) => (d.id === activeDraft.id ? updated : d)),
      );
      toast.success("Draft saved and new response version created");
      queryClient.invalidateQueries({ queryKey: ["responses", activeDraft.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: () => toast.error("Failed to save edited response"),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishResponse(activeDraft.id),
    onSuccess: (updated) => {
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) => (d.id === activeDraft.id ? updated : d)),
      );
      toast.success("Response published to channels");
      queryClient.invalidateQueries({ queryKey: ["responses", activeDraft.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      onNavigate("Response Studio");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Publish failed. Approval required.");
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: () => api.bulkApproveResponses(),
    onSuccess: (res) => {
      queryClient.setQueryData<ResponseDraft[]>(["responses"], (old = []) =>
        old.map((d) => ({ ...d, status: "APPROVED" })),
      );
      toast.success(`Bulk approved ${res.count} pending responses`);
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: () => toast.error("Bulk approval failed"),
  });

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

  const isApproved = activeDraft.status === "APPROVED";

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">GOVERNED RESPONSE</span>
          <h2>Response Studio</h2>
          <p className="subhead">
            Draft, review, and publish with an explicit approval gate and audit trail.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="secondary"
            disabled={bulkApproveMutation.isPending}
            onClick={() => bulkApproveMutation.mutate()}
          >
            <CheckCheck size={14} />
            {bulkApproveMutation.isPending ? "Approving..." : "Bulk approve"}
          </button>
        </div>
      </div>

      <div className="tabs">
        {["Pending", "Approved", "Rejected", "Published", "Global Audit"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Global Audit" ? (
        <GlobalAuditView audit={globalAudit} />
      ) : (
        <>
          {responses.length > 1 && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {responses.map((r) => (
                <button
                  key={r.id}
                  className={`filter ${selectedId === r.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  #{r.id} {r.topic} ({r.status})
                </button>
              ))}
            </div>
          )}

          <div className="response-layout">
            <ApprovalCard
              draft={activeDraft}
              approved={isApproved}
              onApprove={() => approveMutation.mutate()}
              onRegenerate={() => regenerateMutation.mutate()}
              onReject={(reason) => rejectMutation.mutate(reason)}
              onSaveEdit={(body) => editMutation.mutate(body)}
              isApproving={approveMutation.isPending}
              isRegenerating={regenerateMutation.isPending}
              isRejecting={rejectMutation.isPending}
              isSaving={editMutation.isPending}
            />

            <article className="card">
              <CardHead
                title="Audit trail"
                help="Every transition is recorded by the backend."
              />
              <div className="audit">
                <MetricLine label="Topic" value={activeDraft.topic} />
                <MetricLine label="Reviewer" value="Alex Rivera" />
                <MetricLine
                  label="Publish gate"
                  value={isApproved ? "Unlocked" : "Locked until APPROVED"}
                />
                {responseAudit.slice(0, 3).map((entry: AuditLogEntry) => (
                  <MetricLine
                    key={entry.id}
                    label={entry.action.replace("response_", "")}
                    value={entry.after_status || entry.details || entry.actor}
                  />
                ))}
              </div>
              <button
                className="primary full"
                disabled={!isApproved || publishMutation.isPending}
                title={isApproved ? "Publish response" : "Approve before publishing"}
                onClick={() => publishMutation.mutate()}
              >
                <Send size={14} />
                {publishMutation.isPending ? "Publishing..." : "Publish response"}
              </button>
            </article>
          </div>
        </>
      )}

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
