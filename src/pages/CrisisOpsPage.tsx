import { useEffect, useState } from "react";
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
            <span className={state?.stage === s ? "current" : ""} key={s}>
              {s}
            </span>
          ))}
        </div>

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
      </div>
    </div>
  );
}
