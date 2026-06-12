"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const SIZE = 300;
const TRACK_STROKE = 3;
const ARC_STROKE = 8;
const R = (SIZE - 28) / 2;
const C = 2 * Math.PI * R;

// The work arc uses a 3-stop shimmer that sweeps — matches ActiveTaskStatusBar palette
const GOLD_SHIMMER_STOPS = "#09090b 0%, #a16207 25%, #facc15 50%, #a16207 75%, #09090b 100%";

const PHASE_ACCENT = {
  work: "#FACC15",
  shortBreak: "#4ade80",
  longBreak: "#60a5fa",
};

const PHASE_TRACK = {
  work: "rgba(26,26,26,0.10)",
  shortBreak: "rgba(26,26,26,0.08)",
  longBreak: "rgba(26,26,26,0.08)",
};

/**
 * @param {Object} props
 * @param {number}  props.progress
 * @param {string}  props.timeLabel
 * @param {string}  props.phaseLabel
 * @param {'work'|'shortBreak'|'longBreak'} props.phase
 * @param {boolean} props.isRunning
 * @param {boolean} props.didComplete
 * @param {number}  props.workMinutes
 * @param {(m: number) => void} props.onWorkMinutesChange
 */
export function CircularProgressRing({
  progress,
  timeLabel,
  phaseLabel,
  phase = "work",
  isRunning,
  didComplete,
  workMinutes,
  onWorkMinutesChange,
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = C * (1 - clamped);
  const accent = PHASE_ACCENT[phase] ?? PHASE_ACCENT.work;
  const trackColor = PHASE_TRACK[phase] ?? PHASE_TRACK.work;
  const isWork = phase === "work";
  const canEdit = !isRunning && isWork;

  // Leading dot position (SVG is rotated -90deg, so start at top)
  const dotAngle = clamped * 2 * Math.PI - Math.PI / 2;
  const dotX = SIZE / 2 + R * Math.cos(dotAngle);
  const dotY = SIZE / 2 + R * Math.sin(dotAngle);

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>

        {/* Soft ambient glow — breathing when active */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          animate={
            isRunning
              ? { opacity: [0.18, 0.32, 0.18], scale: [1, 1.07, 1] }
              : { opacity: 0, scale: 1 }
          }
          transition={
            isRunning
              ? { duration: 10, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
              : { duration: 1, ease: "easeInOut" }
          }
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, transparent 65%)`,
            filter: "blur(28px)",
          }}
        />

        {/* Completion burst */}
        <AnimatePresence>
          {didComplete && (
            <motion.div
              key="burst"
              aria-hidden
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 1.7, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: `radial-gradient(circle, ${accent}70 0%, transparent 60%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Static SVG track + progress arc */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <defs>
            {/* Gold shimmer gradient for the work arc — same tones as ActiveTaskStatusBar */}
            <linearGradient id="gold-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#a16207" />
              <stop offset="45%"  stopColor="#facc15" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <linearGradient id="green-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#16a34a" />
              <stop offset="50%"  stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="blue-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#1d4ed8" />
              <stop offset="50%"  stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Track ring */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={trackColor}
            strokeWidth={TRACK_STROKE}
          />

          {/* Progress arc — gradient stroke */}
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={
              phase === "shortBreak"
                ? "url(#green-arc-gradient)"
                : phase === "longBreak"
                ? "url(#blue-arc-gradient)"
                : "url(#gold-arc-gradient)"
            }
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 0 8px ${accent}88)`,
            }}
          />

          {/* Leading glowing dot */}
          {clamped > 0.012 && (
            <motion.circle
              cx={dotX} cy={dotY}
              r={ARC_STROKE * 0.75}
              fill={accent}
              animate={{ r: isRunning ? ARC_STROKE * 0.9 : ARC_STROKE * 0.65 }}
              transition={{ duration: 0.35 }}
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            />
          )}
        </svg>

        {/* Sweeping shimmer overlay on the arc when running (work phase only) */}
        {isWork && isRunning && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            animate={{ backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"] }}
            transition={{ duration: 3.5, ease: "linear", repeat: Infinity }}
            style={{
              background: `linear-gradient(90deg, ${GOLD_SHIMMER_STOPS})`,
              backgroundSize: "200% 100%",
              maskImage: "radial-gradient(circle, transparent 42%, black 47%, black 53%, transparent 58%)",
              WebkitMaskImage: "radial-gradient(circle, transparent 42%, black 47%, black 53%, transparent 58%)",
              opacity: 0.55,
            }}
          />
        )}

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Phase label */}
          <motion.p
            key={phaseLabel}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="mb-1 text-[10px] font-semibold uppercase tracking-[0.26em]"
            style={{ color: isRunning ? accent : "rgba(26,26,26,0.40)" }}
          >
            {phaseLabel}
          </motion.p>

          {/* Countdown — charcoal on cream bg, still crisp inside the card */}
          <motion.p
            key={timeLabel}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="font-mono text-[3.8rem] font-bold leading-none tabular-nums tracking-tight text-charcoal"
          >
            {timeLabel}
          </motion.p>

          {/* Duration stepper — idle work phase only */}
          <AnimatePresence>
            {canEdit && (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.22 }}
                className="mt-3 flex items-center gap-3"
              >
                <button
                  type="button"
                  aria-label="Decrease by 1 minute"
                  onClick={() => onWorkMinutesChange(Math.max(1, workMinutes - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal/12 bg-white/70 text-charcoal/50 shadow-glass transition hover:border-charcoal/20 hover:bg-white hover:text-charcoal active:scale-90"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span className="min-w-[3.5ch] text-center font-mono text-xs font-semibold tabular-nums text-charcoal/50">
                  {workMinutes}m
                </span>
                <button
                  type="button"
                  aria-label="Increase by 1 minute"
                  onClick={() => onWorkMinutesChange(Math.min(99, workMinutes + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal/12 bg-white/70 text-charcoal/50 shadow-glass transition hover:border-charcoal/20 hover:bg-white hover:text-charcoal active:scale-90"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
