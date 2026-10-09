import { Check, Edit3, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ResponseDraft } from "../../models/types";
import { CardHead } from "./CardHead";

export type ApprovalCardProps = {
  draft?: ResponseDraft;
  approved?: boolean;
  onApprove: () => void;
  onRegenerate?: () => void;
  onReject?: (reason: string) => void;
  onSaveEdit?: (body: string) => void;
  isApproving?: boolean;
  isRegenerating?: boolean;
  isRejecting?: boolean;
  isSaving?: boolean;
};

export function ApprovalCard({
  draft,
  approved = false,
  onApprove,
  onRegenerate,
  onReject,
  onSaveEdit,
  isApproving = false,
  isRegenerating = false,
  isRejecting = false,
  isSaving = false,
}: ApprovalCardProps) {
  const currentBody =
    draft?.body ??
    "We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly.";
  const currentStatus = draft?.status ?? (approved ? "APPROVED" : "PENDING_REVIEW");

  const [text, setText] = useState(currentBody);
  const [rejectPrompt, setRejectPrompt] = useState(false);
  const [rejectReason, setRejectReason] = useState("Tone is overly defensive");

  useEffect(() => {
    setText(currentBody);
  }, [currentBody]);

  const hasChanged = text !== currentBody;

  const handleConfirmReject = () => {
    onReject?.(rejectReason);
    setRejectPrompt(false);
  };

  return (
    <article className="card">
      <CardHead
        title={`Suggested response · ${draft?.topic ?? "General"}`}
        actions={
          <span className={`status-pill status-${currentStatus.toLowerCase()}`}>
            {currentStatus}
          </span>
        }
      />
      <textarea
        aria-label="Response draft"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "6px",
        }}
      >
        <div className="char-count">
          {text.length} characters · tone: empathetic
        </div>
        {hasChanged && onSaveEdit && (
          <button
            className="secondary"
            style={{ fontSize: "11px", padding: "4px 8px" }}
            disabled={isSaving}
            onClick={() => onSaveEdit(text)}
          >
            <Edit3 size={12} /> {isSaving ? "Saving..." : "Save edit"}
          </button>
        )}
      </div>

      {rejectPrompt ? (
        <div
          className="reject-box"
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "var(--surface-2)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          <label style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}>
            Rejection reason:
          </label>
          <input
            aria-label="Rejection reason input"
            style={{
              width: "100%",
              padding: "6px 8px",
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "12px",
              marginBottom: "8px",
            }}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="button-row" style={{ marginTop: "4px" }}>
            <button
              className="destructive"
              disabled={isRejecting}
              onClick={handleConfirmReject}
            >
              {isRejecting ? "Rejecting..." : "Confirm Reject"}
            </button>
            <button className="ghost" onClick={() => setRejectPrompt(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          <button
            className="secondary"
            disabled={isRegenerating}
            onClick={onRegenerate}
          >
            <RotateCw size={14} />
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            className="destructive"
            disabled={isRejecting}
            onClick={() => setRejectPrompt(true)}
          >
            <X size={14} />
            Reject
          </button>
          <button
            className="primary"
            disabled={isApproving || currentStatus === "APPROVED"}
            onClick={onApprove}
          >
            <Check size={15} />
            {isApproving
              ? "Approving..."
              : currentStatus === "APPROVED"
                ? "Approved"
                : "Approve"}
          </button>
        </div>
      )}

      <div className="stepper">
        <span>✓ DRAFT</span>
        <span
          className={
            currentStatus === "PENDING_REVIEW" ? "current" : ""
          }
        >
          → PENDING
        </span>
        <span
          className={
            currentStatus === "APPROVED" || currentStatus === "PUBLISHED"
              ? "current"
              : ""
          }
        >
          → APPROVED
        </span>
        <span className={currentStatus === "PUBLISHED" ? "current" : ""}>
          → PUBLISHED
        </span>
        {currentStatus === "REJECTED" && (
          <span className="current" style={{ color: "var(--red)" }}>
            ✕ REJECTED
          </span>
        )}
      </div>
    </article>
  );
}
