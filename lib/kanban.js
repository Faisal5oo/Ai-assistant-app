/** @type {import('framer-motion').Transition} */
export const KANBAN_SPRING = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

/** Column/card layout morph — matches Eisenhower matrix motion */
export const KANBAN_MORPH_SPRING = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

/** Dropzone entrance — pop & glow on column hover */
export const KANBAN_DROP_SPRING = {
  type: "spring",
  stiffness: 250,
  damping: 25,
};

/** @type {import('@/types/interfaces').TaskStatus[]} */
export const KANBAN_STATUSES = ["Todo", "In-Progress", "Completed"];

/**
 * @type {Record<
 *   import('@/types/interfaces').TaskStatus,
 *   {
 *     title: string;
 *     subtitle: string;
 *     hint: string;
 *     accent: string;
 *     hoverTint: string;
 *     glowRing: string;
 *     glowShadow: string;
 *     iconName: string;
 *   }
 * >}
 */
export const COLUMN_META = {
  Todo: {
    title: "To Do",
    subtitle: "Queued & ready",
    hint: "Capture work before it starts",
    accent: "from-charcoal/[0.05] via-white/70 to-white/55",
    hoverTint: "rgba(26, 26, 26, 0.06)",
    glowRing: "rgba(26, 26, 26, 0.22)",
    glowShadow: "rgba(26, 26, 26, 0.08)",
    iconName: "Circle",
  },
  "In-Progress": {
    title: "In Progress",
    subtitle: "Active focus",
    hint: "Tasks you are executing right now",
    accent: "from-gold/20 via-white/70 to-white/55",
    hoverTint: "rgba(250, 204, 21, 0.14)",
    glowRing: "rgba(250, 204, 21, 0.5)",
    glowShadow: "rgba(250, 204, 21, 0.2)",
    iconName: "Clock3",
  },
  Completed: {
    title: "Completed",
    subtitle: "Shipped",
    hint: "Closed loops and delivered outcomes",
    accent: "from-charcoal/[0.08] via-white/65 to-white/50",
    hoverTint: "rgba(26, 26, 26, 0.08)",
    glowRing: "rgba(52, 211, 153, 0.4)",
    glowShadow: "rgba(52, 211, 153, 0.12)",
    iconName: "CheckCircle2",
  },
};
