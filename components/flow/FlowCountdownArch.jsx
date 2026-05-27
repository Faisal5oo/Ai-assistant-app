"use client";

import { memo, useEffect, useRef, useState } from "react";

function padTwo(n) {
  return String(n).padStart(2, "0");
}

function formatHms(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h: padTwo(h), m: padTwo(m), s: padTwo(s) };
}

const ARCH_RADIUS = 120;
const ARCH_CIRCUMFERENCE = 2 * Math.PI * ARCH_RADIUS;

/**
 * @param {Object} props
 * @param {number} props.totalSeconds
 * @param {number} props.startedAt
 * @param {() => void} props.onComplete
 */
function FlowCountdownArchInner({ totalSeconds, startedAt, onComplete }) {
  const endsAtRef = useRef(startedAt + totalSeconds * 1000);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const [remaining, setRemaining] = useState(() => {
    const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
    return Math.max(0, left);
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    endsAtRef.current = startedAt + totalSeconds * 1000;
    const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
    setRemaining(Math.max(0, left));
    completedRef.current = false;
  }, [startedAt, totalSeconds]);

  useEffect(() => {
    const tick = () => {
      const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      const next = Math.max(0, left);
      setRemaining(next);
      if (next <= 0 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = totalSeconds - remaining;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const strokeOffset = ARCH_CIRCUMFERENCE * (1 - progress);
  const { h, m, s } = formatHms(remaining);

  return (
    <div className="relative flex flex-col items-center" aria-live="polite" aria-atomic="true">
      <svg
        width={280}
        height={280}
        viewBox="0 0 280 280"
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={140}
          cy={140}
          r={ARCH_RADIUS}
          fill="none"
          stroke="rgba(26,26,26,0.06)"
          strokeWidth={6}
        />
        <circle
          cx={140}
          cy={140}
          r={ARCH_RADIUS}
          fill="none"
          stroke="url(#flowArchGradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={ARCH_CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <defs>
          <linearGradient id="flowArchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-charcoal/35">
          Chrono Progress
        </p>
        <div className="flex items-baseline gap-2 font-display tabular-nums tracking-wide text-charcoal md:gap-3">
          {Number(h) > 0 && (
            <>
              <TimeUnit value={h} />
              <span className="text-2xl font-light text-gold-dark/70 md:text-3xl">:</span>
            </>
          )}
          <TimeUnit value={m} />
          <span className="text-2xl font-light text-gold-dark/70 md:text-3xl">:</span>
          <TimeUnit value={s} />
        </div>
      </div>
    </div>
  );
}

/** @param {{ value: string }} props */
function TimeUnit({ value }) {
  return (
    <span className="text-5xl font-semibold md:text-6xl lg:text-7xl">{value}</span>
  );
}

export const FlowCountdownArch = memo(FlowCountdownArchInner);
