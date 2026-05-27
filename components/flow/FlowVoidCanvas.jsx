"use client";

import { motion } from "framer-motion";
import { FLOW_LAYOUT_TRANSITION } from "@/lib/flowConstants";
import { FlowCountdownArch } from "./FlowCountdownArch";
import { FlowAmbientBoard } from "./FlowAmbientBoard";
import { FlowVelocityMeter } from "./FlowVelocityMeter";

/**
 * @param {Object} props
 * @param {{ primaryTaskTitle: string; durationMinutes: number; startedAt: number }} props.session
 * @param {() => void} props.onComplete
 */
export function FlowVoidCanvas({ session, onComplete }) {
  const totalSeconds = session.durationMinutes * 60;

  return (
    <>
      <FlowVelocityMeter
        totalSeconds={totalSeconds}
        startedAt={session.startedAt}
      />
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FLOW_LAYOUT_TRANSITION}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream-50/95 px-6"
        style={{
          background:
            "linear-gradient(165deg, #FDFCF8 0%, #F9F7F2 50%, #F3EFE6 100%)",
        }}
      >
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-dark/90">
          The Void · Monastic Cockpit
        </p>
        <h2 className="mb-10 max-w-lg text-center font-display text-base font-medium tracking-wide text-charcoal/70 md:text-lg">
          {session.primaryTaskTitle}
        </h2>

        <FlowCountdownArch
          totalSeconds={totalSeconds}
          startedAt={session.startedAt}
          onComplete={onComplete}
        />

        <div className="mt-14 w-full px-4">
          <FlowAmbientBoard active />
        </div>
      </motion.div>
    </>
  );
}
