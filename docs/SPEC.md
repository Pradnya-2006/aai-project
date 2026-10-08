# Social Media Sentiment & Response Agent

This implementation starts with an offline-first command center demo: a typed React shell, computed in-memory demo stream metrics, live mention simulation, theme switching, responsive navigation, risk signal, and approval-gated response interaction. The visual contract follows the supplied PS-06 prompt pack.

## Next integration seam

The UI now calls `src/api.ts` for mentions, summary metrics, simulated stream events, and response approval. If the API is unavailable, the command center keeps its deterministic offline fallback so the demo remains usable without downloads or network access.

## Run the API

```powershell
& .venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --port 8000
```

The frontend uses `http://127.0.0.1:8000` by default. Set `VITE_API_URL` to point at another local API instance.

## Current implementation boundary

The project now includes a deterministic 30-day SQLite seed, filter-aware mention and summary endpoints, computed topic, risk, and competitor metrics, an SSE mention stream, a real LangGraph analysis pipeline with retries, conditional routing, per-node timing, and approval interrupts, connected analytical pages, demo mode, command palette, notification/help modals, no-flash theme initialization, crisis detector stages, approval-gated publishing, and browser regression coverage. External platform integrations, production model providers, authentication, and cloud deployment remain outside the offline MVP boundary.

## Phase acceptance: calibrated data and staged incident simulation

- The fixed seed contains 25,000 labelled mentions: 24,900 in the current 24-hour window and 100 historical records across X, Reddit, Instagram, LinkedIn, YouTube, Facebook, Trustpilot, G2, App Store, and Google Reviews.
- Every mention stores ground truth for mention type, sentiment, emotion, intensity, and influence impact. The seed asserts its minimum size and negative-label calibration.
- Current computed calibration is 24,900 mentions, 16% negative, 84/100 brand health, App Update Failure 1,024 mentions at 82% negative and 327% growth, Login Issues approximately 682, Dark Mode approximately 451, and Pricing approximately 310.
- Classification, sentiment/emotion, and influence agents expose structured outputs and measured held-out accuracy; influence uses the specified 0-100 weighted formula.
- Risk output includes z-score, severity rules, frozen-baseline state, predicted risk, and a two-hour predicted peak.
- Crisis Ops is a persistent staged simulator with start, pause, reset, speed control, real agent processing, detector-derived story stages, live notifications, and clean rollback to the pre-incident state.
