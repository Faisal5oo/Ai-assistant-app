"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { PenLine } from "lucide-react";
import { BrainDumpTaskRow } from "./BrainDumpTaskRow";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 */
export function BrainDumpPanel({ tasks }) {
  return (
    <aside className="relative flex min-h-[520px] flex-col overflow-hidden rounded-4xl border border-[#e8e2d6]/80 bg-gradient-to-b from-[#fffdf7] to-[#f7f3eb] p-5 shadow-soft md:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(250,204,21,0.12), transparent 40%)",
        }}
      />

      <div className="relative mb-5 flex items-start gap-3 border-b border-charcoal/[0.07] pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-charcoal">
          <PenLine size={18} strokeWidth={2} />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-charcoal">
            Brain dump
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-charcoal/50">
            Premium scratchpad — capture ideas here, then lock them onto the
            runway.
          </p>
        </div>
      </div>

      <p className="relative mb-3 font-display text-xs font-medium uppercase tracking-widest text-charcoal/35">
        {tasks.length} unallocated
      </p>

      <LayoutGroup>
        <ul className="relative flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.li
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-charcoal/12 bg-white/30 px-4 py-10 text-center text-sm leading-relaxed text-charcoal/40"
              >
                Your scratchpad is clear — every open task lives on the timeline.
                Clear a block to bring one back.
              </motion.li>
            ) : (
              tasks.map((task) => (
                <BrainDumpTaskRow key={task.id} task={task} />
              ))
            )}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
    </aside>
  );
}
