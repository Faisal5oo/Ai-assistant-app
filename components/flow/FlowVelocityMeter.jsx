"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * @param {Object} props
 * @param {number} props.totalSeconds
 * @param {number} props.startedAt
 */
function FlowVelocityMeterInner({ totalSeconds, startedAt }) {
  const endsAtRef = useRef(startedAt + totalSeconds * 1000);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    endsAtRef.current = startedAt + totalSeconds * 1000;
  }, [startedAt, totalSeconds]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const total = totalSeconds * 1000;
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgress(pct);
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startedAt, totalSeconds]);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-1 bg-charcoal/5"
      aria-hidden
    >
      <motion.div
        className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.2, ease: "linear" }}
      />
    </div>
  );
}

export const FlowVelocityMeter = memo(FlowVelocityMeterInner);
