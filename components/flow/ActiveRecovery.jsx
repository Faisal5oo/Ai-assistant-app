"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Wind } from "lucide-react";
import { FLOW_RECOVERY_SECONDS } from "@/lib/flowConstants";

/**
 * @param {Object} props
 * @param {() => void} props.onRecoveryComplete
 * @param {() => void} props.onExit
 */
export function ActiveRecovery({ onRecoveryComplete, onExit }) {
  const endsAtRef = useRef(Date.now() + FLOW_RECOVERY_SECONDS * 1000);
  const onRecoveryCompleteRef = useRef(onRecoveryComplete);
  const completedRef = useRef(false);
  const [remaining, setRemaining] = useState(FLOW_RECOVERY_SECONDS);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onRecoveryCompleteRef.current = onRecoveryComplete;
  }, [onRecoveryComplete]);

  useEffect(() => {
    const tick = () => {
      const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      const next = Math.max(0, left);
      setRemaining(next);
      if (next <= 0 && !completedRef.current) {
        completedRef.current = true;
        setDone(true);
        onRecoveryCompleteRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-5 py-8 text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark/90">
        Session Deep Recovery
      </p>
      <h2 className="mt-2 max-w-md font-display text-xl font-semibold tracking-wide text-charcoal sm:mt-3 sm:text-2xl md:text-3xl">
        Lower cortisol before you re-enter the world
      </h2>
      <p className="mt-2 max-w-sm text-xs tracking-wide text-charcoal/45 sm:mt-3 sm:text-sm">
        Follow the breathing ring. This recovery window cannot be skipped.
      </p>

      <div className="relative mt-8 flex h-[min(56vw,14rem)] w-[min(56vw,14rem)] items-center justify-center sm:mt-12 sm:h-56 sm:w-56 md:h-64 md:w-64">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold/30"
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-gold/50 bg-gold/5"
          animate={{ scale: [1.05, 0.95, 1.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <Wind size={28} className="mb-3 text-gold-dark/80" />
          <span className="font-display text-4xl font-semibold tabular-nums tracking-wide text-charcoal">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-charcoal/35">
            Breathe in · Hold · Release
          </span>
        </div>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10"
        >
          <Link
            href="/dashboard"
            onClick={onExit}
            className="pill-btn-gold inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold tracking-wide"
          >
            Return to Dashboard
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
