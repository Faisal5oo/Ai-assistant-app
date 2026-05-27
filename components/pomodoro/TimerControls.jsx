"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.isRunning
 * @param {() => void} props.onStart
 * @param {() => void} props.onPause
 * @param {() => void} props.onReset
 * @param {() => void} props.onSkip
 */
export function TimerControls({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className="pill-btn-gold min-w-[140px]"
      >
        {isRunning ? (
          <>
            <Pause size={18} />
            Pause
          </>
        ) : (
          <>
            <Play size={18} />
            Start
          </>
        )}
      </button>
      <button type="button" onClick={onSkip} className="pill-btn-ghost">
        <SkipForward size={16} />
        Skip
      </button>
      <button type="button" onClick={onReset} className="pill-btn-ghost">
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}
