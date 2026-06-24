"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const routeVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Wraps page children in an AnimatePresence-keyed motion block so every
 * route change produces a seamless opacity+glide crossfade instead of a
 * hard content swap. Must be a client component because it reads pathname.
 */
export function RouteTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={routeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
