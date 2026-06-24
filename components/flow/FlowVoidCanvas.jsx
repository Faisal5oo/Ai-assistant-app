"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FLOW_LAYOUT_TRANSITION } from "@/lib/flowConstants";
import { FlowCountdownArch } from "./FlowCountdownArch";
import { FlowAmbientBoard } from "./FlowAmbientBoard";
import { FlowVelocityMeter } from "./FlowVelocityMeter";
import { FlowParticleCanvas } from "./FlowParticleCanvas";

/**
 * @param {Object} props
 * @param {{ primaryTaskTitle: string; runwayQueue: string[]; targetTaskIds: string[]; durationMinutes: number; startedAt: number }} props.session
 * @param {() => void} props.onComplete
 * @param {() => void} [props.onAbandon]
 * @param {import('@/types/interfaces').Task[]} [props.tasks]
 */
function FlowVoidCanvasInner({ session, onComplete, onAbandon, tasks = [] }) {
  const totalSeconds = session.durationMinutes * 60;
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  // Build ordered execution cards from runwayQueue
  const taskMap = Object.fromEntries((tasks ?? []).map((t) => [t.id, t]));
  const runwayCards = (session.runwayQueue ?? [])
    .map((id) => taskMap[id])
    .filter(Boolean);

  const handleAbandonRequest = useCallback(() => {
    setShowAbandonConfirm(true);
  }, []);

  const handleAbandonConfirm = useCallback(() => {
    setShowAbandonConfirm(false);
    onAbandon?.();
  }, [onAbandon]);

  return (
    <>
      <FlowVelocityMeter totalSeconds={totalSeconds} startedAt={session.startedAt} />
      <FlowParticleCanvas active />

      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FLOW_LAYOUT_TRANSITION}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8"
        style={{
          background: "linear-gradient(165deg, #FDFCF8 0%, #F9F7F2 50%, #F0EBE0 100%)",
        }}
      >
        {/* Header label */}
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-dark/90">
          The Void · Monastic Cockpit
        </p>

        {/* Primary task title */}
        <h2 className="mb-6 max-w-lg text-center font-display text-sm font-medium tracking-wide text-charcoal/70 sm:mb-10 sm:text-base md:text-lg">
          {session.primaryTaskTitle}
        </h2>

        {/* Countdown arch */}
        <FlowCountdownArch
          totalSeconds={totalSeconds}
          startedAt={session.startedAt}
          onComplete={onComplete}
        />

        {/* Runway execution cards */}
        {runwayCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 w-full max-w-lg sm:mt-10 sm:max-w-2xl"
          >
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-charcoal/35">
              Execution Runway
            </p>
            <div className="flex flex-col gap-2">
              {runwayCards.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.07, duration: 0.35 }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                    index === 0
                      ? "border-gold/40 bg-gold/10 shadow-[0_4px_20px_rgba(234,179,8,0.1)]"
                      : "border-white/60 bg-white/35 backdrop-blur-sm"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      index === 0
                        ? "bg-gold/30 text-charcoal"
                        : "bg-charcoal/8 text-charcoal/45"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p
                    className={`line-clamp-1 text-sm font-medium tracking-wide ${
                      index === 0 ? "text-charcoal" : "text-charcoal/55"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.priority === "High" && index === 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-charcoal">
                      Priority
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ambient soundscape bar */}
        <div className="mt-6 w-full max-w-lg px-2 sm:mt-10 sm:max-w-2xl sm:px-4">
          <FlowAmbientBoard active />
        </div>

        {/* Abandon session */}
        <motion.button
          type="button"
          onClick={handleAbandonRequest}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="mt-8 text-[11px] font-medium tracking-widest text-charcoal/25 uppercase transition hover:text-charcoal/50"
        >
          Exit session
        </motion.button>
      </motion.div>

      {/* Abandon confirm overlay */}
      <AnimatePresence>
        {showAbandonConfirm && (
          <motion.div
            key="abandon-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-charcoal/40 px-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-sm border-gold/20 p-5 text-center sm:p-8"
            >
              <button
                type="button"
                onClick={() => setShowAbandonConfirm(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-charcoal/40 hover:text-charcoal"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark/80">
                Exit Flow State?
              </p>
              <p className="mt-3 text-sm leading-relaxed tracking-wide text-charcoal/55">
                Your progress will be logged as an abandoned session. This cannot be undone.
              </p>
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAbandonConfirm(false)}
                  className="flex-1 rounded-2xl border border-charcoal/15 bg-white/70 py-3 text-sm font-medium text-charcoal/60 transition hover:border-charcoal/30"
                >
                  Stay in flow
                </button>
                <button
                  type="button"
                  onClick={handleAbandonConfirm}
                  className="flex-1 rounded-2xl bg-charcoal py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-charcoal/85"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const FlowVoidCanvas = memo(FlowVoidCanvasInner);
