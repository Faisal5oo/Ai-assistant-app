"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useCreateTaskMutation } from "@/hooks/queries/useTaskMutations";
import { appToast } from "@/lib/toast";

const CATEGORY_OPTIONS = ["Work", "Personal", "Learning", "Health"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const SHEET_VARIANTS = {
  hidden: { opacity: 0, y: -16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/**
 * Global Quick-Add Command Sheet
 * Triggered by Ctrl+K or pressing "N" outside of input contexts.
 */
export function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Work");
  const [priority, setPriority] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef(null);
  const createMutation = useCreateTaskMutation();

  const openSheet = useCallback(() => {
    setTitle("");
    setCategory("Work");
    setPriority("Medium");
    setSubmitted(false);
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setOpen(false);
  }, []);

  // Global keyboard listener
  useEffect(() => {
    function onKeyDown(e) {
      // Ctrl+K — works everywhere
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) return false; // toggle off
          return true;
        });
        return;
      }

      // "N" key — only when focus is NOT in an input/textarea/contenteditable
      if (e.key === "n" || e.key === "N") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isEditable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          document.activeElement?.isContentEditable;
        if (!isEditable) {
          e.preventDefault();
          openSheet();
        }
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        closeSheet();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openSheet, closeSheet]);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (open) {
      // Tick delay to let AnimatePresence mount the input
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      const trimmed = title.trim();
      if (!trimmed || createMutation.isPending) return;

      try {
        await createMutation.mutateAsync({
          title: trimmed,
          category,
          priority,
          estimatedTime: 30,
          tags: [],
        });

        setSubmitted(true);
        // Brief success flash, then auto-close
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
        }, 600);
      } catch {
        // useCreateTaskMutation already fires appToast.error internally
      }
    },
    [title, category, priority, createMutation]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="quick-add-overlay"
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30 backdrop-blur-md"
          onMouseDown={(e) => {
            // Close when clicking the backdrop, not the card
            if (e.target === e.currentTarget) closeSheet();
          }}
        >
          <motion.div
            key="quick-add-card"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg mx-4"
            role="dialog"
            aria-modal="true"
            aria-label="Quick add task"
          >
            <form
              onSubmit={handleSubmit}
              className="relative rounded-2xl border border-white/10 bg-charcoal shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Header bar */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/[0.06]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/20">
                  <Plus size={14} className="text-gold" />
                </div>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/40">
                  Quick Add Task
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30 font-mono">
                    Enter
                  </kbd>
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/10 transition"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Main input */}
              <div className="px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to get done?"
                  maxLength={200}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent text-white placeholder-white/20 text-base font-medium outline-none caret-gold"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      closeSheet();
                    }
                  }}
                />
              </div>

              {/* Options row */}
              <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
                {/* Category pills */}
                <div className="flex items-center gap-1.5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-gold text-charcoal"
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="h-3 w-px bg-white/10 mx-1" />

                {/* Priority pills */}
                <div className="flex items-center gap-1.5">
                  {PRIORITY_OPTIONS.map((p) => {
                    const colors =
                      p === "High"
                        ? "bg-red-500/80 text-white"
                        : p === "Medium"
                        ? "bg-amber-400/80 text-charcoal"
                        : "bg-white/20 text-white/70";
                    const inactiveColors =
                      "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60";
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                          priority === p ? colors : inactiveColors
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!title.trim() || createMutation.isPending || submitted}
                  className="ml-auto flex h-8 min-w-[72px] items-center justify-center gap-1.5 rounded-xl bg-gold px-3 text-xs font-semibold text-charcoal disabled:opacity-40 hover:bg-gold-dark transition-all"
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 size={13} />
                      Done
                    </>
                  ) : createMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={13} />
                      Add
                    </>
                  )}
                </button>
              </div>

              {/* Hint bar */}
              <div className="px-4 py-2 bg-white/[0.025] border-t border-white/[0.05] flex items-center gap-4">
                <span className="text-[10px] text-white/20 tracking-wide">
                  Task added to{" "}
                  <span className="text-white/40 font-medium">Inbox · Pending</span>
                </span>
                <span className="ml-auto text-[10px] text-white/15">
                  <kbd className="font-mono">Ctrl K</kbd> to toggle
                </span>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
