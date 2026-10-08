# Decisions

- The frontend remains React/Vite with the existing CSS token layer so the current offline-first contract and visual regression selectors remain stable.
- Installed the requested UI/tooling dependencies: Tailwind CSS, PostCSS, Autoprefixer, Radix Dialog/Tabs/Tooltip, cmdk, Sonner, Framer Motion, Recharts, Lucide React, Inter, and TanStack Query.
- Recharts is used for analytical charts, Framer Motion for interaction transitions, Lucide for iconography, and Inter is self-hosted through `@fontsource/inter`.
- The backend remains the source of truth for metrics, risk, calibration, orchestration, and approval governance; the UI must not replace computed values with presentation constants.
- Kept deterministic seed data and API-backed fallback behavior so the workspace remains usable offline while exposing an explicit offline error state when loading fails.
- Approval is an explicit backend transition, and publishing is rejected unless the persisted response status is `APPROVED`.
- The mobile overflow fix contains the horizontally scrollable agent pipeline inside its card while keeping the document itself at the viewport width.
