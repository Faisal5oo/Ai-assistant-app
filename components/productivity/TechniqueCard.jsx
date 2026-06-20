"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

/* ─── Motion variants ────────────────────────────────────────────────────── */

/** Gentle Apple-style organic lift — no aggressive scale */
const panelVariants = {
  rest: {
    y: 0,
    boxShadow:
      "0 1px 3px rgba(26,26,26,0.04), 0 1px 2px rgba(26,26,26,0.03)",
  },
  hover: {
    y: -3,
    boxShadow:
      "0 8px 24px rgba(26,26,26,0.08), 0 2px 8px rgba(26,26,26,0.04)",
    transition: { type: "spring", stiffness: 260, damping: 30 },
  },
};

/** Chevron slides right, breathing mirror loop */
const chevronVariants = {
  rest: { x: 0 },
  hover: {
    x: 4,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 22,
      repeat: Infinity,
      repeatType: "mirror",
    },
  },
};

/** Underline sweeps in from left */
const underlineVariants = {
  rest: { scaleX: 0, originX: 0 },
  hover: {
    scaleX: 1,
    originX: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Hover shimmer — muted cream wash, no glow */
const shimmerVariants = {
  rest: { opacity: 0 },
  hover: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

/**
 * @param {Object}  props
 * @param {string}  props.title
 * @param {string}  props.description
 * @param {React.ReactNode} props.icon
 * @param {string}  props.actionLabel
 * @param {() => void} [props.onApply]
 * @param {string}  [props.href]
 * @param {boolean} [props.active]
 */
export function TechniqueCard({
  title,
  description,
  icon,
  actionLabel,
  onApply,
  href,
  active,
}) {
  /* ── Shared CTA — text-link with sliding underline + chevron ── */
  const ActionTrigger = () => (
    <span className="inline-flex items-center gap-2">
      <span className="relative">
        <span
          className={[
            "text-[11.5px] font-semibold tracking-[0.06em] uppercase transition-colors duration-200",
            active
              ? "text-gold-dark"
              : "text-amber-600 hover:text-amber-700",
          ].join(" ")}
        >
          {actionLabel}
        </span>
        <motion.span
          variants={underlineVariants}
          className="absolute -bottom-px left-0 h-px w-full bg-amber-600/50 block"
        />
      </span>

      <motion.span
        variants={chevronVariants}
        className="inline-flex text-amber-600"
      >
        <MoveRight size={13} strokeWidth={2} />
      </motion.span>
    </span>
  );

  return (
    <motion.article
      variants={panelVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className={[
        "group relative h-full flex flex-col justify-between items-start",
        "rounded-2xl p-6 overflow-hidden cursor-default",
        /* Warm-light glass panel */
        "bg-white/30",
        /* Ultra-thin low-contrast perimeter */
        "border transition-colors duration-300",
        active
          ? "border-gold/40 shadow-[0_0_0_1.5px_rgba(250,204,21,0.25)]"
          : "border-zinc-200/50 hover:border-zinc-200/80",
      ].join(" ")}
    >
      {/* ── Hover shimmer — barely-visible cream wash ── */}
      <motion.div
        variants={shimmerVariants}
        className="pointer-events-none absolute inset-0 rounded-2xl bg-white/60"
      />

      {/* ── Active session warm tint ── */}
      {active && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.07) 0%, transparent 65%)",
          }}
        />
      )}

      {/* ── Active pulse dot ── */}
      {active && (
        <span className="absolute top-4 right-4 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
      )}

      {/* ── Top content block ── */}
      <div className="relative z-10 flex flex-col gap-3.5 w-full">
        {/* Icon badge — warm cream container, charcoal icon */}
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
            "bg-cream-100 border border-zinc-200/60",
            active ? "text-gold-dark" : "text-charcoal/70",
          ].join(" ")}
        >
          {icon}
        </div>

        {/* Title — deep charcoal, tight tracking */}
        <h3 className="font-display text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
          {title}
        </h3>

        {/* Description — 3-line pool, dark neutral gray */}
        <p className="text-[12.5px] leading-relaxed text-zinc-600 line-clamp-3 min-h-[57px]">
          {description}
        </p>
      </div>

      {/* ── Bottom CTA — always anchored at base ── */}
      <div className="relative z-10 mt-5 w-full">
        {/* Hairline divider — warm tone */}
        <div className="mb-4 h-px w-full bg-gradient-to-r from-zinc-200/80 via-zinc-200/40 to-transparent" />

        {href ? (
          <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded">
            <ActionTrigger />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onApply}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded"
          >
            <ActionTrigger />
          </button>
        )}
      </div>
    </motion.article>
  );
}
