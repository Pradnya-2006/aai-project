# Local API

The offline backend is implemented in `backend/app/main.py` and stores its state in SQLite.

- `GET /api/mentions` returns the latest mentions.
- `GET /api/summary` returns computed mention, sentiment, health, and risk metrics.
- `GET /api/topics` returns topic volume, growth, negative share, and velocity metrics computed from SQLite mentions.
- `GET /api/risk` returns the highest-volume risk cluster with severity, baseline, z-score, and recommended action.
- `GET /api/competitors` returns computed share of voice, negative sentiment, and brand health for ACME and comparison brands.
- `POST /api/analysis/run` runs the LangGraph analysis pipeline with retries, conditional alert routing, per-node timing, and an approval interrupt.
- `POST /api/analysis/{run_id}/approve` resumes an interrupted analysis after human approval.
- `GET /api/crisis/story` returns detector-derived NORMAL through CRITICAL stages and the AI recommendation.
- `GET /api/influencers` returns impact-weighted authors and engagement.
- `GET /api/campaigns` returns topic-based campaign performance signals.
- `GET /api/executive` returns leadership-ready headline metrics.
- `POST /api/crisis/simulate` projects volume and negative sentiment for a selected severity.
- `POST /api/mentions/simulate` inserts a deterministic demo-stream mention.
- `GET /api/mentions/stream` opens an SSE stream for newly inserted mentions.
- `POST /api/responses/1/approve` transitions the response draft to `approved`.
- `POST /api/responses/1/publish` returns `409` unless the current state is `APPROVED`.
- `GET /api/agents` exposes the 11 logical pipeline agents and their current status.
- `POST /api/agents/run` processes the current workspace signals.
- `GET /api/notifications` and `POST /api/notifications/read` manage event notifications.
- `GET /api/search?query=...` searches mentions, authors and topics.
- `GET /api/health` verifies the service and database path.

Approval is a backend mutation rather than a UI-only state change. The frontend only shows the approved state after the API confirms the transition.
