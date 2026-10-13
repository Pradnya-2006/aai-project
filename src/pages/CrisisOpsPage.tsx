import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { MetricLine } from "../components/ui/MetricLine";
import { SeverityBadge } from "../components/ui/StatusBadge";
import type { SimulatorState } from "../models/types";

export type CrisisOpsPageProps = {
  state: SimulatorState | null;
  onState: (s: SimulatorState) => void;
};

const STAGES = [
  "NORMAL",
  "ANOMALY",
  "SPIKE",
  "HIGH RISK",
  "CRITICAL",
  "AI RECOMMENDATION",
];

export default function CrisisOpsPage({ state, onState }: CrisisOpsPageProps) {
  const [speed, setSpeed] = useState(1);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [responsePlan, setResponsePlan] = useState<string | null>(null);
  const chart = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        name: `${index + 1}h`,
        mentions: Math.round(40 + index * index * 5 + (state?.inserted ?? 0) / 5),
      })),
    [state?.inserted],
  );

  useEffect(() => {
    if (!state || state.status !== "running") return;
    const timer = setTimeout(
      () => api.crisisTick().then(onState).catch(() => undefined),
      2000 / speed,
    );
    return () => clearTimeout(timer);
  }, [state, speed, onState]);

  const handleStart = () => {
    api
      .crisisStart(speed)
      .then((s) => {
        onState(s);
        toast.info(`Crisis simulation started at ${speed}x speed`);
      })
      .catch(() => toast.error("Could not start simulation"));
  };

  const handlePause = () => {
    api
      .crisisPause()
      .then((s) => {
        onState(s);
        toast.info("Crisis simulation paused");
      })
      .catch(() => toast.error("Could not pause simulation"));
  };

  const handleReset = () => {
    api
      .crisisReset()
      .then((s) => {
        onState(s);
        toast.info("Crisis simulation reset");
      })
      .catch(() => toast.error("Could not reset simulation"));
  };

  const runAction = (action: "incident" | "response" | "notify") => {
    setActionPending(action);
    const request =
      action === "incident"
        ? api.drawerOpenIncident(undefined, "App Update Failure")
        : action === "response"
          ? api.drawerGenerateResponse(undefined, "App Update Failure")
          : api.drawerNotifyProductTeam(undefined, "Product Team");
    request
      .then((result) => {
        if (action === "response") {
          setResponsePlan(result.response_plan ?? result.message);
        }
        toast.success(result.message);
      })
      .catch(() => toast.error("Crisis action failed"))
      .finally(() => setActionPending(null));
  };

  const alert =
    state?.stage === "ANOMALY"
      ? "Anomaly detected"
      : state?.stage === "SPIKE"
        ? "Spike detected"
        : state?.stage === "HIGH RISK"
          ? "High risk: critical predicted in 2h"
          : state?.stage === "CRITICAL"
            ? "Crisis detected"
            : state?.stage === "AI RECOMMENDATION"
              ? "AI recommends escalating to Product team"
              : "";

  return (
    <div className="content">
      <div className="page-title">
        <div>
          <span className="eyebrow">LIVE INCIDENT CONTROL</span>
          <h2>Crisis Ops</h2>
          <p className="subhead">
            Synthetic mentions are processed by the live agent path.
          </p>
        </div>
        <SeverityBadge severity={state?.stage ?? "NORMAL"} className="critical" />
      </div>

      <div className="card crisis-card">
        <div className="story-stepper">
          {STAGES.map((s) => (
            <span className={STAGES.indexOf(s) <= STAGES.indexOf(state?.stage ?? "NORMAL") ? "current" : ""} key={s}>
              {s}
            </span>
          ))}
        </div>
        {alert && <div className="action-box crisis-alert">{alert}</div>}

        <div className="crisis-stats">
          <MetricLine label="Status" value={state?.status ?? "idle"} />
          <MetricLine
            label="Simulated hour"
            value={String(state?.hour ?? 0)}
          />
          <MetricLine
            label="Inserted signals"
            value={(state?.inserted ?? 0).toLocaleString()}
          />
        </div>

        <label className="speed-control">
          Speed{" "}
          <select
            className="filter"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </label>

        <div className="button-row">
          <button className="primary" onClick={handleStart}>
            Start
          </button>
          <button className="secondary" onClick={handlePause}>
            Pause
          </button>
          <button className="ghost" onClick={handleReset}>
            Reset
          </button>
        </div>
        <div className="crisis-live-chart">
          <div className="card-head"><h3>Live negative mentions</h3><span className="muted">Current: {state?.inserted ?? 0}</span></div>
          <div className="mini-chart" aria-label="Live negative mentions chart">
            {chart.map((point) => <i key={point.name} style={{ height: `${Math.min(100, point.mentions / 8)}%` }} title={`${point.name}: ${point.mentions}`} />)}
          </div>
        </div>
        {state?.stage === "AI RECOMMENDATION" && (
          <div className="card crisis-recommendation">
            <span className="eyebrow">AI RECOMMENDATION</span>
            <h3>Escalate the App Update Failure to the Product team.</h3>
            <div className="button-row">
              <button className="destructive" disabled={!!actionPending} onClick={() => runAction("incident")}>Open Incident</button>
              <button className="secondary" disabled={!!actionPending} onClick={() => runAction("response")}>Generate Response Plan</button>
              <button className="secondary" disabled={!!actionPending} onClick={() => runAction("notify")}>Notify Product Team</button>
            </div>
            {responsePlan && (
              <div className="action-box crisis-response-plan">
                <strong>Response plan</strong>
                <p>{responsePlan}</p>
                <span className="muted">Draft only · requires human approval in Response Studio</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
