"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} props.icon
 * @param {string} props.actionLabel
 * @param {() => void} props.onAction
 */
export function TechniqueLanding({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl"
    >
      <Link
        href="/productivity"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition hover:text-charcoal"
      >
        <ArrowLeft size={16} />
        Productivity hub
      </Link>

      <div className="glass-card p-8 md:p-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
          {icon}
        </div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/55">
          {description}
        </p>
        <button type="button" onClick={onAction} className="pill-btn-gold mt-6">
          {actionLabel}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
