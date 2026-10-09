import { Check } from "lucide-react";
import { CardHead } from "./CardHead";

export type ApprovalCardProps = {
  approved: boolean;
  onApprove: () => void;
  onRegenerate?: () => void;
  onReject?: () => void;
};

export function ApprovalCard({
  approved,
  onApprove,
  onRegenerate,
  onReject,
}: ApprovalCardProps) {
  return (
    <article className="card">
      <CardHead
        title="Suggested response"
        actions={
          <span className="status-pill">
            {approved ? "APPROVED" : "PENDING REVIEW"}
          </span>
        }
      />
      <textarea
        aria-label="Response draft"
        defaultValue="We’re sorry you’re running into this. Our team has identified the login issue and is working on a fix. We’ll share an update shortly."
      />
      <div className="char-count">146 characters · tone: empathetic</div>
      <div className="button-row">
        <button className="secondary" onClick={onRegenerate}>
          Regenerate
        </button>
        <button className="destructive" onClick={onReject}>
          Reject
        </button>
        <button className="primary" onClick={onApprove}>
          <Check size={15} />Approve
        </button>
      </div>
      <div className="stepper">
        <span>✓ DRAFT</span>
        <span>→ PENDING</span>
        <span className={approved ? "current" : ""}>→ APPROVED</span>
        <span>→ PUBLISHED</span>
      </div>
    </article>
  );
}
