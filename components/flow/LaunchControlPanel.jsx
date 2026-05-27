"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import {
  FLOW_DEFAULT_MINUTES,
  FLOW_LAYOUT_TRANSITION,
  FLOW_MAX_MINUTES,
  FLOW_MIN_MINUTES,
} from "@/lib/flowConstants";
import { formatFlowDurationLabel, selectTopFlowTargets } from "@/lib/flowUtils";
import { TargetTaskDeck } from "./TargetTaskDeck";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.batchingFilterTag
 * @param {(config: { primaryTaskId: string; targetTaskIds: string[]; durationMinutes: number }) => void} props.onIgnite
 */
export function LaunchControlPanel({ tasks, batchingFilterTag, onIgnite }) {
  const targets = selectTopFlowTargets(tasks, batchingFilterTag);
  const [selectedId, setSelectedId] = useState(targets[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState(FLOW_DEFAULT_MINUTES);

  useEffect(() => {
    if (targets.length === 0) {
      setSelectedId("");
      return;
    }
    if (!targets.some((t) => t.id === selectedId)) {
      setSelectedId(targets[0].id);
    }
  }, [targets, selectedId]);

  const canIgnite = Boolean(selectedId);

  const handleIgnite = () => {
    if (!canIgnite) return;
    onIgnite({
      primaryTaskId: selectedId,
      targetTaskIds: targets.map((t) => t.id),
      durationMinutes,
    });
  };

  const progress =
    ((durationMinutes - FLOW_MIN_MINUTES) /
      (FLOW_MAX_MINUTES - FLOW_MIN_MINUTES)) *
    100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={FLOW_LAYOUT_TRANSITION}
      className="glass-card mx-auto w-full max-w-3xl border-gold/20 p-8 md:p-10"
    >
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
        <Zap size={22} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark/90">
        Launch Control
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-charcoal md:text-3xl">
        Calibrate Your Focus Runway
      </h2>
      <p className="mt-2 text-sm leading-relaxed tracking-wide text-charcoal/50">
        Align intent, duration, and high-priority targets before you enter the
        void.
      </p>

      <div className="mt-8">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/40">
          High-Intent Target Array
        </label>
        <TargetTaskDeck
          tasks={targets}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/40">
            Focus Duration
          </label>
          <span className="font-display text-lg font-semibold tabular-nums tracking-wide text-gold-dark">
            {formatFlowDurationLabel(durationMinutes)}
          </span>
        </div>
        <div className="relative pt-1">
          <input
            type="range"
            min={FLOW_MIN_MINUTES}
            max={FLOW_MAX_MINUTES}
            step={5}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="flow-golden-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-charcoal/8"
            style={{
              background: `linear-gradient(to right, #EAB308 0%, #FACC15 ${progress}%, rgba(26,26,26,0.08) ${progress}%, rgba(26,26,26,0.08) 100%)`,
            }}
            aria-label="Focus duration in minutes"
          />
          <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-widest text-charcoal/35">
            <span>{FLOW_MIN_MINUTES}m</span>
            <span>{FLOW_MAX_MINUTES}m</span>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        disabled={!canIgnite}
        onClick={handleIgnite}
        whileHover={canIgnite ? { scale: 1.01 } : undefined}
        whileTap={canIgnite ? { scale: 0.99 } : undefined}
        transition={FLOW_LAYOUT_TRANSITION}
        className="pill-btn-gold mt-10 flex w-full items-center justify-center gap-2 py-4 text-base font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Flame size={18} />
        Ignite Flow
      </motion.button>
    </motion.div>
  );
}
