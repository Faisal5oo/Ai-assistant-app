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

/**
 * Isolated countdown — paused until isRunning; ticks locally to avoid parent re-renders.
 * @param {Object} props
 * @param {number} props.totalSeconds
 * @param {boolean} props.isRunning
 * @param {boolean} [props.isFrozen]
 * @param {number | null} props.endsAt - epoch ms when countdown reaches zero
 * @param {number | null} [props.frozenRemainingSeconds]
 * @param {() => void} props.onComplete
 */
function DeepWorkCountdownInner({
  totalSeconds,
  isRunning,
  isFrozen = false,
  endsAt,
  frozenRemainingSeconds,
  onComplete,
}) {
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    if (isFrozen && frozenRemainingSeconds != null) {
      setRemaining(frozenRemainingSeconds);
      return undefined;
    }
    if (!isRunning || !endsAt) {
      setRemaining(totalSeconds);
      return undefined;
    }

    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      const next = Math.max(0, left);
      setRemaining(next);
      if (next <= 0 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isRunning, isFrozen, endsAt, totalSeconds, frozenRemainingSeconds]);

  const { h, m, s } = formatHms(remaining);

  return (
    <div
      className="flex items-baseline justify-center gap-3 font-display tabular-nums tracking-tight text-charcoal md:gap-5"
      aria-live="polite"
      aria-atomic="true"
    >
      <TimeUnit value={h} label="Hours" />
      <span className="text-3xl font-light text-gold-dark/80 md:text-5xl">:</span>
      <TimeUnit value={m} label="Minutes" />
      <span className="text-3xl font-light text-gold-dark/80 md:text-5xl">:</span>
      <TimeUnit value={s} label="Seconds" />
    </div>
  );
}

/** @param {{ value: string; label: string }} props */
function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-5xl font-semibold md:text-7xl lg:text-8xl">{value}</span>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
        {label}
      </span>
    </div>
  );
}

export const DeepWorkCountdown = memo(DeepWorkCountdownInner);
