"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} props.icon
 * @param {string} props.actionLabel
 * @param {() => void} [props.onApply]
 * @param {string} [props.href]
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
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className={`glass-card flex flex-col p-6 transition ${
        active ? "ring-2 ring-gold" : ""
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/60">
        {description}
      </p>
      {href ? (
        <Link href={href} className="pill-btn-gold mt-4 w-full sm:w-auto">
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onApply}
          className="pill-btn-gold mt-4 w-full sm:w-auto"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </button>
      )}
    </motion.article>
  );
}
