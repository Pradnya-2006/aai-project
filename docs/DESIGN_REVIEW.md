# Part C Design Review

## C1: Command Center decision questions

The Command Center now answers these six questions from live API state:

1. **What is happening?** The active risk cluster and current mention volume.
2. **Why is it happening?** The detector's recommended action and negative-sentiment share.
3. **What is the impact?** Current negative percentage and brand-health score.
4. **Who owns the next action?** The response team / human approval workflow.
5. **When should action happen?** `Now` for an active risk signal.
6. **How confident is the pipeline?** The number of completed, timed LangGraph nodes.

## 20-area review checklist

| Area | Result | Evidence |
|---|---|---|
| 1. Hierarchy | Fixed | Eyebrow, heading, metric, and action layers are explicit. |
| 2. Navigation | Fixed | All primary pages are reachable from sidebar and palette. |
| 3. Search | Fixed | Mention search remains available and `/`/Cmd-K opens the palette. |
| 4. Demo mode | Fixed | Persistent Demo Mode toggle is available in the sidebar. |
| 5. Notifications | Fixed | Notification drawer/modal opens from the top bar. |
| 6. Keyboard help | Fixed | `?` opens the shortcut help modal. |
| 7. Theme persistence | Fixed | Theme is applied in `index.html` before React mounts. |
| 8. Mobile layout | Fixed | Grid min-content overflow and the pipeline's absolutely-positioned connectors are contained at 390px. |
| 9. Empty states | Fixed | Empty filtered mention state is explicit. |
| 10. API errors | Fixed | Offline demo notice is shown when API calls fail. |
| 11. Live updates | Fixed | SSE mention stream updates the dashboard. |
| 12. Competitors | Fixed | Share of voice, sentiment, and health are computed by API. |
| 13. Topics | Fixed | Topic volume, growth, velocity, and negative share are computed. |
| 14. Risk | Fixed | Severity, baseline, z-score, and action are detector-derived. |
| 15. Crisis story | Fixed | NORMAL through CRITICAL plus recommendation comes from detector output. |
| 16. AI orchestration | Fixed | LangGraph has conditional alert routing and approval interrupt. |
| 17. Retry policy | Fixed | All orchestrator nodes use a three-attempt retry policy. |
| 18. Approval governance | Fixed | Publishing is rejected unless response status is APPROVED. |
| 19. Data integrity | Fixed | Tests assert analytical values come from persisted mention data. |
| 20. Regression coverage | Fixed | Backend, build, and Playwright suites pass. |

## Visual upgrade validation evidence

- Backend: `12 passed` (one LangGraph serializer deprecation warning).
- Frontend: `npm.cmd run build` passed; Vite reports the existing large Recharts bundle warning.
- Playwright: `7 passed` in `tests/command-center.spec.ts`, including API-killed state with Retry, empty state, crisis simulation, command palette, approval compatibility, all primary routes, named-control checks, both themes, and 390px overflow.
- A direct 390px browser probe identified the pipeline connector as the widest element; adding a positioned connector and contained pipeline overflow reduced document scroll width to exactly the 390px viewport.
- Theme persistence is initialized before React mounts and the browser suite exercises both dark and light layouts.

## Remaining verification

- The requested full dead-button audit, all-route screenshot matrix (1440px/390px × dark/light × three rounds), and automated AA contrast assertions are not yet represented as dedicated tests.
- Some installed packages (TanStack Query, Radix primitives, Tailwind, and Sonner) remain available for the next component extraction pass; the current screen implementation still contains compatible local wrappers.
