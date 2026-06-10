"use client";

import { motion } from "framer-motion";

/**
 * @param {{ className?: string, style?: import('react').CSSProperties }} props
 */
export function Skeleton({ className = "", style }) {
  return (
    <motion.div
      aria-hidden
      className={`relative overflow-hidden rounded-xl bg-charcoal/[0.06] ${className}`}
      style={style}
      animate={{ opacity: [0.55, 0.85, 0.55] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}

export function SkeletonCircle({ className = "h-11 w-11" }) {
  return <Skeleton className={`rounded-full ${className}`} />;
}

export function SkeletonText({ className = "h-4 w-full" }) {
  return <Skeleton className={className} />;
}
