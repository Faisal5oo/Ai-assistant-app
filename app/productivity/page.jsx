"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { ActiveSessionBar } from "@/components/productivity/ActiveSessionBar";
import { TimeBlockingModal } from "@/components/productivity/TimeBlockingModal";
import { BatchingModal } from "@/components/productivity/BatchingModal";
import { EisenhowerMatrixModal } from "@/components/productivity/EisenhowerMatrixModal";
import { getTasksFromCache } from "@/lib/query-cache";
import { TECHNIQUES } from "@/lib/productivityTechniques";

/* ─────────────────────────────────────────────────────────────────────────────
   Per-technique abstract canvas previews
   Each returns a purely decorative SVG/div composition that conveys the
   mental model of the technique without any text duplication.
───────────────────────────────────────────────────────────────────────────── */

function PomodoroPreview() {
  return (
    <div className="relative flex items-center justify-center w-full flex-1 min-h-0 select-none">
      {/* Outer faint ring */}
      <div className="absolute h-52 w-52 rounded-full border border-zinc-200/70" />
      <div className="absolute h-40 w-40 rounded-full border border-zinc-200/50" />
      {/* Progress arc — static decorative SVG */}
      <svg className="absolute h-52 w-52 -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100" cy="100" r="94"
          fill="none"
          stroke="rgba(251,191,36,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="590"
          strokeDashoffset="150"
        />
      </svg>
      {/* Centre numeric display */}
      <div className="relative flex flex-col items-center">
        <span className="font-display text-6xl font-semibold tracking-tighter text-zinc-900 leading-none tabular-nums">
          25:00
        </span>
        <span className="mt-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-400">
          Focus sprint
        </span>
      </div>
      {/* Tick marks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1.5 w-px bg-zinc-200"
          style={{
            top: "6px",
            left: "50%",
            transformOrigin: "50% 96px",
            transform: `rotate(${i * 30}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function TimeBlockingPreview() {
  const slots = [
    { label: "Deep Research", width: "w-full", color: "bg-amber-400/20 border-amber-400/30", top: "09:00" },
    { label: "Design Review", width: "w-4/5",  color: "bg-zinc-100 border-zinc-200/80",     top: "11:30" },
    { label: "Team Sync",     width: "w-1/2",  color: "bg-zinc-100 border-zinc-200/80",     top: "14:00" },
    { label: "Writing Block", width: "w-3/4",  color: "bg-zinc-100 border-zinc-200/80",     top: "15:30" },
  ];
  return (
    <div className="flex w-full flex-1 min-h-0 flex-col gap-2.5 justify-center px-2">
      {/* Timeline axis */}
      <div className="relative flex flex-col gap-2.5">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-zinc-400 font-medium">
              {slot.top}
            </span>
            <div className="relative flex-1">
              <div
                className={[
                  slot.width,
                  slot.color,
                  "rounded-lg border px-3 py-2",
                ].join(" ")}
              >
                <span className="text-[11px] font-semibold text-zinc-700">
                  {slot.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Thin timeline rail */}
      <div className="ml-[52px] mt-1 h-px bg-gradient-to-r from-zinc-200 via-zinc-200/60 to-transparent" />
    </div>
  );
}

function DeepWorkPreview() {
  return (
    <div className="relative flex items-center justify-center w-full flex-1 min-h-0 select-none">
      {/* Concentric focus rings */}
      {[112, 88, 64, 40].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-zinc-200/60"
          style={{ width: size * 2, height: size * 2, opacity: 1 - i * 0.15 }}
        />
      ))}
      {/* Centre focal dot */}
      <div className="relative flex flex-col items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-zinc-900" />
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-400">
          90 min · deep focus
        </span>
      </div>
      {/* Ambient glow */}
      <div
        className="absolute h-24 w-24 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

function TaskBatchingPreview() {
  const groups = [
    { label: "Email & Comms", count: 4, color: "bg-amber-400/15 border-amber-400/25" },
    { label: "Code Reviews",  count: 3, color: "bg-zinc-100 border-zinc-200/70" },
    { label: "Admin Tasks",   count: 5, color: "bg-zinc-100 border-zinc-200/70" },
  ];
  return (
    <div className="flex w-full flex-1 min-h-0 items-center justify-center">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {groups.map((g, i) => (
          <div
            key={i}
            className={["rounded-xl border px-4 py-3 flex items-center justify-between", g.color].join(" ")}
          >
            <span className="text-[12.5px] font-semibold text-zinc-800">{g.label}</span>
            <span className="flex gap-1">
              {Array.from({ length: g.count }).map((_, j) => (
                <span
                  key={j}
                  className="h-1.5 w-1.5 rounded-full bg-zinc-400/50"
                  style={{ opacity: 1 - j * 0.12 }}
                />
              ))}
            </span>
          </div>
        ))}
        {/* Connecting rail */}
        <div className="mx-auto h-8 w-px bg-gradient-to-b from-zinc-200 to-transparent" />
        <div className="rounded-xl border border-zinc-200/60 bg-white/60 px-4 py-2.5 text-center">
          <span className="text-[11px] font-semibold tracking-wide text-zinc-500">
            Single session output
          </span>
        </div>
      </div>
    </div>
  );
}

function EisenhowerPreview() {
  const quads = [
    { label: "DO",      sub: "Urgent · Important",     bg: "bg-zinc-900",         text: "text-white", sub2: "text-white/50" },
    { label: "PLAN",    sub: "Not Urgent · Important",  bg: "bg-amber-400/20",     text: "text-zinc-800", sub2: "text-zinc-500" },
    { label: "DELEGATE",sub: "Urgent · Not Important",  bg: "bg-zinc-100",         text: "text-zinc-700", sub2: "text-zinc-400" },
    { label: "DELETE",  sub: "Not Urgent · Not Imp.",   bg: "bg-zinc-50",          text: "text-zinc-400", sub2: "text-zinc-300" },
  ];
  return (
    <div className="flex w-full flex-1 min-h-0 items-center justify-center">
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {quads.map((q, i) => (
          <div
            key={i}
            className={["rounded-xl p-3.5 flex flex-col gap-1 border border-zinc-200/50", q.bg].join(" ")}
          >
            <span className={["text-[11px] font-bold tracking-[0.08em]", q.text].join(" ")}>
              {q.label}
            </span>
            <span className={["text-[9.5px] leading-tight", q.sub2].join(" ")}>
              {q.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowStatePreview() {
  return (
    <div className="relative flex items-center justify-center w-full flex-1 min-h-0 select-none overflow-hidden">
      {/* Wave layers */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-x-0 rounded-[50%] border border-zinc-200/50"
          style={{
            height: `${120 + i * 40}px`,
            top: `${30 + i * 18}%`,
            transform: `scaleX(${1.2 + i * 0.15})`,
            opacity: 1 - i * 0.25,
          }}
        />
      ))}
      {/* Centre state label */}
      <div className="relative flex flex-col items-center gap-1.5">
        <span className="font-display text-4xl font-semibold tracking-tighter text-zinc-900">
          Flow
        </span>
        <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-zinc-400">
          45 min · skill–challenge match
        </span>
        {/* Subtle amber dot */}
        <div
          className="mt-1 h-16 w-16 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(250,204,21,0.2) 0%, transparent 75%)",
          }}
        />
      </div>
    </div>
  );
}

const PREVIEWS = {
  pomodoro:        PomodoroPreview,
  "time-blocking": TimeBlockingPreview,
  "deep-work":     DeepWorkPreview,
  batching:        TaskBatchingPreview,
  eisenhower:      EisenhowerPreview,
  flow:            FlowStatePreview,
};

/* ─── Motion variants ────────────────────────────────────────────────────── */

const canvasContentVariants = {
  enter: { opacity: 0, y: 14 },
  center: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 180, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ProductivityPage() {
  const applyTechnique       = useTaskStore((s) => s.applyTechnique);
  const storeActiveTechnique = useTaskStore((s) => s.activeTechnique);
  const productivityModal    = useTaskStore((s) => s.productivityModal);
  const setProductivityModal = useTaskStore((s) => s.setProductivityModal);
  const { tasks }            = useTasks();

  /* Local theater state — tracks which technique the canvas is showing */
  const [focused, setFocused] = useState(TECHNIQUES[0].id);

  const [feedback, setFeedback] = useState("");

  const showFeedback = useCallback((message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 4000);
  }, []);

  const closeModal = useCallback(() => {
    setProductivityModal(null);
  }, [setProductivityModal]);

  const handleApply = useCallback(
    (techniqueId) => {
      const result = applyTechnique(techniqueId);
      if (result === "modal") return;

      if (result) {
        const task =
          tasks.find((t) => t.id === result) ??
          getTasksFromCache().find((t) => t.id === result);
        const label =
          TECHNIQUES.find((t) => t.id === techniqueId)?.title ?? techniqueId;
        showFeedback(`${label} started on "${task?.title ?? "task"}"`);
        return;
      }

      showFeedback("Create or select a task first in the Tasks view.");
    },
    [applyTechnique, tasks, showFeedback]
  );

  const focusedTech = TECHNIQUES.find((t) => t.id === focused) ?? TECHNIQUES[0];
  const PreviewComponent = PREVIEWS[focused] ?? PomodoroPreview;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {/* ── Active session bar (renders only when a session is running) ── */}
      <ActiveSessionBar />

      {/* ── Feedback toast ── */}
      <AnimatePresence>
        {feedback && (
          <motion.p
            key="feedback"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="rounded-2xl border border-gold/25 bg-gold/10 px-4 py-2.5 text-[12.5px] font-medium text-charcoal/80"
          >
            {feedback}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
          ASYMMETRIC SPLIT THEATER
          Left  → 4 cols: vertical nav deck
          Right → 8 cols: reactive canvas preview
          ════════════════════════════════════════════════════════════════════ */}
      {/*
        ════════════════════════════════════════════════════════════════════
        Root theater wrapper
        Mobile  → flex-col, natural document height
        Desktop → 12-col grid, viewport-locked height
        ════════════════════════════════════════════════════════════════════
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 lg:items-stretch lg:h-[calc(100vh-120px)] lg:min-h-[520px]">

        {/* ── LEFT: Navigation Deck ──────────────────────────────────────── */}
        <nav className="lg:col-span-4 flex flex-col lg:justify-between">
          {/* Page header — hidden on mobile to preserve vertical space */}
          <div className="hidden lg:block mb-8">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-charcoal/35 mb-3">
              Techniques Hub
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 leading-tight">
              Proven frameworks.<br />
              <span className="text-zinc-400">Applied instantly.</span>
            </h1>
          </div>

          {/* Mobile eyebrow — shown only on small screens */}
          <div className="lg:hidden mb-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-charcoal/35">
              Techniques Hub
            </p>
          </div>

          {/*
            Technique index list
            Mobile  → horizontal snap-scroll pill carousel
            Desktop → vertical stacked list with layoutId accent bar
          */}
          <ol className={[
            /* shared */
            "relative gap-1",
            /* mobile: horizontal scroll row */
            "flex flex-row overflow-x-auto whitespace-nowrap snap-x snap-mandatory pb-2 scrollbar-hide",
            /* desktop: revert to vertical column */
            "lg:flex-col lg:overflow-x-visible lg:whitespace-normal lg:pb-0 lg:flex-1",
          ].join(" ")}>
            {TECHNIQUES.map((tech, i) => {
              const Icon = tech.icon;
              const isActive = focused === tech.id;
              const isRunning = storeActiveTechnique === tech.id;

              return (
                <li
                  key={tech.id}
                  className="relative snap-center shrink-0 lg:shrink lg:snap-align-none"
                >
                  {/* layoutId accent bar — slides behind active item on desktop */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 rounded-xl bg-white/70 border border-zinc-200/60 shadow-sm shadow-zinc-100"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setFocused(tech.id)}
                    onMouseEnter={() => setFocused(tech.id)}
                    className="relative z-10 flex items-center gap-2.5 lg:gap-3.5 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-left transition-colors duration-150 w-full"
                  >
                    {/* Index number — desktop only */}
                    <span
                      className={[
                        "hidden lg:inline shrink-0 w-5 text-[10px] font-bold tabular-nums",
                        isActive ? "text-zinc-400" : "text-zinc-400",
                      ].join(" ")}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Icon */}
                    <span
                      className={[
                        "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200",
                        isActive
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100/80 text-zinc-500",
                      ].join(" ")}
                    >
                      <Icon size={14} strokeWidth={1.8} />
                    </span>

                    {/* Title */}
                    <span
                      className={[
                        "font-display text-[13px] lg:text-[13.5px] font-semibold tracking-tight transition-colors duration-200",
                        /* mobile: fixed width so pills don't collapse */
                        "lg:flex-1",
                        isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
                      ].join(" ")}
                    >
                      {tech.title}
                    </span>

                    {/* Live session dot */}
                    {isRunning && (
                      <span className="shrink-0 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-gold opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* ── Mobile swipe hint — centred, premium, no dots ── */}
          <div className="lg:hidden flex items-center justify-center mt-3 pointer-events-none select-none">
            {/*
              Three-layer composition:
              1. Outer halo — slow breath pulse (opacity)
              2. Pill body — horizontal drift loop
              3. Hand icon + label inside the pill
            */}
            <motion.div
              /* Outer ambient halo */
              animate={{ opacity: [0.18, 0.38, 0.18] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-8 w-28 rounded-full bg-zinc-900/8 blur-md"
            />

            <motion.div
              /* Pill body — drifts right then snaps back */
              animate={{ x: [0, 8, 0] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: [0.45, 0, 0.55, 1],
                repeatDelay: 1.1,
              }}
              className="relative flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/70 backdrop-blur-sm px-3.5 py-1.5 shadow-sm shadow-zinc-200/60"
            >
              {/* Hand / swipe icon */}
              <svg
                width="13" height="13"
                viewBox="0 0 16 16"
                fill="none"
                className="text-zinc-500 shrink-0"
              >
                {/* index finger pointing right */}
                <path
                  d="M3 8.5C3 8.5 3.5 7 5 7C6 7 6.5 7.5 7 8C7.5 7 8.2 6 9.5 6C10.8 6 11 7 11 7.5V9.5C11 11.5 9.5 13 8 13H6C4.8 13 3 11.8 3 10V8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 8V5C7 4.2 7.5 3.5 8.5 3.5C9.5 3.5 10 4.2 10 5V6"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
                {/* motion trail lines */}
                <path
                  d="M12 6.5h2M12.5 8.5H14M12 10.5h1.5"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>

              {/* Label */}
              <span className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-zinc-500">
                Swipe
              </span>

              {/* Trailing chevron — offset pulse */}
              <motion.span
                animate={{ x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1.1,
                  delay: 0.15,
                }}
                className="text-zinc-400"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2.5 5h5M5.5 2.5L8 5l-2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </motion.div>
          </div>

          {/* Bottom tagline — desktop only */}
          <p className="hidden lg:block mt-6 text-[11px] text-zinc-400 leading-relaxed">
            Each technique is wired directly to your active task queue.
          </p>
        </nav>

        {/* ── RIGHT: Theater Canvas ──────────────────────────────────────── */}
        <div className="w-full lg:col-span-8 relative overflow-hidden rounded-3xl bg-white/80 border border-zinc-200/50 shadow-md shadow-zinc-200/20 p-5 sm:p-8 flex flex-col justify-between min-h-[420px] lg:min-h-0">

          {/* Faint warm radial behind the preview */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(250,204,21,0.04) 0%, transparent 65%)",
            }}
          />

          {/* Canvas content — switches with spring physics */}
          <AnimatePresence mode="wait">
            <motion.div
              key={focused}
              variants={canvasContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative z-10 flex flex-col h-full gap-6"
            >
              {/* Canvas header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  {/* Technique number badge */}
                  <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-zinc-400">
                    {String(TECHNIQUES.findIndex((t) => t.id === focused) + 1).padStart(2, "0")} / {String(TECHNIQUES.length).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-[22px] sm:text-[28px] font-semibold tracking-tight text-zinc-900 leading-snug">
                    {focusedTech.title}
                  </h2>
                  <p className="mt-0.5 max-w-full sm:max-w-sm text-[12.5px] sm:text-[13px] leading-relaxed text-zinc-500">
                    {focusedTech.description}
                  </p>
                </div>

                {/* Active session indicator inside canvas */}
                {storeActiveTechnique === focused && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="shrink-0 mt-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10.5px] font-semibold tracking-wide text-gold-dark"
                  >
                    Active
                  </motion.span>
                )}
              </div>

              {/* Abstract visual preview — constrained height on mobile, flex-1 on desktop */}
              <div className="h-48 sm:h-56 lg:h-auto lg:flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                <PreviewComponent />
              </div>

              {/* Canvas footer: CTA */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {focusedTech.href ? (
                  <Link href={focusedTech.href}>
                    <motion.span
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      className="inline-flex items-center gap-2.5 bg-zinc-950 text-white hover:bg-zinc-900 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full transition-colors duration-200 text-[12.5px] sm:text-[13px] font-semibold tracking-tight cursor-pointer"
                    >
                      Open Workstation
                      <ArrowRight size={14} strokeWidth={2} />
                    </motion.span>
                  </Link>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => handleApply(focused)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="inline-flex items-center gap-2.5 bg-zinc-950 text-white hover:bg-zinc-900 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full transition-colors duration-200 text-[12.5px] sm:text-[13px] font-semibold tracking-tight"
                  >
                    Open Workstation
                    <ArrowRight size={14} strokeWidth={2} />
                  </motion.button>
                )}

                {/* Secondary ghost hint — hidden on very small screens */}
                <span className="hidden sm:inline text-[11px] text-zinc-400">
                  {focusedTech.actionType === "timer"
                    ? `${focusedTech.targetMs ? Math.round(focusedTech.targetMs / 60000) : "—"} min session`
                    : "Interactive workspace"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ── */}
      <TimeBlockingModal
        open={productivityModal === "time-blocking"}
        onClose={closeModal}
      />
      <BatchingModal
        open={productivityModal === "batching"}
        onClose={closeModal}
        onFeedback={showFeedback}
      />
      <EisenhowerMatrixModal
        open={productivityModal === "eisenhower"}
        onClose={closeModal}
        onFeedback={showFeedback}
      />
    </motion.div>
  );
}
