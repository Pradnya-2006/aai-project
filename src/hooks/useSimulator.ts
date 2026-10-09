import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import type { SimulatorState } from "../models/types";

export function useSimulator(onStateChange?: () => void) {
  const [simulator, setSimulator] = useState<SimulatorState | null>(null);

  useEffect(() => {
    api.crisisState().then(setSimulator).catch(() => undefined);
    const timer = window.setInterval(() => {
      api
        .crisisState()
        .then((s) => {
          setSimulator(s);
          if (s.status === "running" && onStateChange) {
            onStateChange();
          }
        })
        .catch(() => undefined);
    }, 2000);

    return () => clearInterval(timer);
  }, [onStateChange]);

  const start = async (speed: number) => {
    try {
      const state = await api.crisisStart(speed);
      setSimulator(state);
      toast.info(`Crisis simulation started (${speed}x speed)`);
      return state;
    } catch {
      toast.error("Failed to start crisis simulation");
    }
  };

  const pause = async () => {
    try {
      const state = await api.crisisPause();
      setSimulator(state);
      toast.info("Crisis simulation paused");
      return state;
    } catch {
      toast.error("Failed to pause crisis simulation");
    }
  };

  const reset = async () => {
    try {
      const state = await api.crisisReset();
      setSimulator(state);
      toast.info("Crisis simulation reset to baseline");
      return state;
    } catch {
      toast.error("Failed to reset crisis simulation");
    }
  };

  const tick = async () => {
    try {
      const state = await api.crisisTick();
      setSimulator(state);
      return state;
    } catch {
      return null;
    }
  };

  return {
    simulator,
    setSimulator,
    start,
    pause,
    reset,
    tick,
  };
}
