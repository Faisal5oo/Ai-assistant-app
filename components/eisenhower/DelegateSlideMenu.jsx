"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, UserRound } from "lucide-react";
import { EISENHOWER_SPRING } from "@/lib/eisenhower";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(meta: { delegateTo?: string; automateCandidate?: boolean }) => void} props.onUpdate
 */
export function DelegateSlideMenu({ task, open, onClose, onUpdate }) {
  const [assignee, setAssignee] = useState(task.delegateTo ?? "");
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    if (open) {
      setAssignee(task.delegateTo ?? "");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, task.delegateTo]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={EISENHOWER_SPRING}
          className="overflow-hidden"
        >
          <div className="mt-2 space-y-2 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-glass">
            <label className="flex items-center gap-2 text-xs text-charcoal/55">
              <UserRound size={14} className="shrink-0" />
              Delegate to…
            </label>
            <input
              ref={inputRef}
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              onBlur={() => onUpdate({ delegateTo: assignee.trim() || undefined })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdate({ delegateTo: assignee.trim() || undefined });
                  onClose();
                }
                if (e.key === "Escape") onClose();
              }}
              placeholder="Name or team"
              className="input-field py-2 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                onUpdate({ automateCandidate: !task.automateCandidate })
              }
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                task.automateCandidate
                  ? "bg-gold/25 text-charcoal"
                  : "bg-charcoal/[0.04] text-charcoal/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bot size={14} />
                Automation candidate
              </span>
              <span
                className={`h-5 w-9 rounded-full p-0.5 transition ${
                  task.automateCandidate ? "bg-gold" : "bg-charcoal/15"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white shadow transition ${
                    task.automateCandidate ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
