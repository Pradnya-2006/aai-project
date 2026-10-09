import type { AuditLogEntry } from "../../models/types";
import { CardHead } from "./CardHead";

export function GlobalAuditView({ audit }: { audit: AuditLogEntry[] }) {
  return (
    <article className="card">
      <CardHead
        title="Global Audit Log"
        help="Full audit trail across all responses, drawer actions, and alerts."
      />
      <div className="audit-table" style={{ marginTop: "14px" }}>
        {audit.length === 0 ? (
          <div className="muted" style={{ padding: "16px", textAlign: "center" }}>
            No audit records found.
          </div>
        ) : (
          audit.map((a) => (
            <div
              key={a.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <strong>{a.action}</strong>
                {a.details && <span className="muted"> · {a.details}</span>}
                {a.before_status && a.after_status && (
                  <span className="status-pill" style={{ marginLeft: "6px" }}>
                    {a.before_status} → {a.after_status}
                  </span>
                )}
              </div>
              <div style={{ textAlign: "right" }} className="muted">
                <span>{a.actor}</span>
                <small style={{ display: "block", fontSize: "10px" }}>
                  {new Date(a.created_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
