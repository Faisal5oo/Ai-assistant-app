/** @type {import('framer-motion').Transition} */
export const EISENHOWER_SPRING = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

/** Q1 card expand/collapse — same smooth tween as general Eisenhower motion */
export const EISENHOWER_MORPH_SPRING = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

export const EISENHOWER_INBOX_ZONE = "inbox";

/** @type {import('@/types/interfaces').EisenhowerQuadrant[]} */
export const EISENHOWER_QUADRANTS = [1, 2, 3, 4];

/**
 * @param {import('@/types/interfaces').Task} task
 * @returns {import('@/types/interfaces').EisenhowerQuadrant | null}
 */
export function getTaskEisenhowerZone(task) {
  if (task.eisenhowerQuadrant) return task.eisenhowerQuadrant;
  return null;
}

/**
 * Auto-suggest quadrant from priority (modal / legacy fallback).
 * @param {import('@/types/interfaces').Task} task
 * @returns {import('@/types/interfaces').EisenhowerQuadrant}
 */
export function getEisenhowerQuadrant(task) {
  const urgent =
    task.priority === "High" || task.status === "In-Progress";
  const important =
    task.priority === "High" || task.priority === "Medium";
  if (urgent && important) return 1;
  if (!urgent && important) return 2;
  if (urgent && !important) return 3;
  return 4;
}

/**
 * @param {import('@/types/interfaces').Task} task
 * @returns {import('@/types/interfaces').EisenhowerQuadrant}
 */
export function resolveEisenhowerQuadrant(task) {
  return task.eisenhowerQuadrant ?? getEisenhowerQuadrant(task);
}

/** @type {Record<import('@/types/interfaces').EisenhowerQuadrant, { title: string; subtitle: string; hint: string; accent: string; hoverTint: string; iconName: string }>} */
export const QUADRANT_META = {
  1: {
    title: "Do Immediately",
    subtitle: "Urgent & Important",
    hint: "Firefighting and high-stakes execution",
    accent: "from-gold/25 via-white/70 to-white/55",
    hoverTint: "rgba(250, 204, 21, 0.12)",
    iconName: "Zap",
  },
  2: {
    title: "Strategic Leverage",
    subtitle: "Not Urgent · Important",
    hint: "Deep work, scaling, learning, future growth",
    accent: "from-charcoal/[0.06] via-white/70 to-white/55",
    hoverTint: "rgba(26, 26, 26, 0.06)",
    iconName: "Compass",
  },
  3: {
    title: "Delegate / Automate",
    subtitle: "Urgent · Not Important",
    hint: "Admin friction, reports, low-leverage pings",
    accent: "from-charcoal/[0.08] via-white/65 to-white/50",
    hoverTint: "rgba(26, 26, 26, 0.08)",
    iconName: "Users",
  },
  4: {
    title: "Eliminate / Purge",
    subtitle: "Not Urgent · Not Important",
    hint: "Noise, context-switching, pure distraction",
    accent: "from-charcoal/[0.04] via-white/60 to-white/45",
    hoverTint: "rgba(26, 26, 26, 0.05)",
    iconName: "ShieldAlert",
  },
};

/** Weekly strategic task target for Q2 commitment meter */
export const WEEKLY_STRATEGIC_GOAL = 5;
