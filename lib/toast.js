import toast from "react-hot-toast";

/**
 * @param {unknown} error
 * @param {string} fallback
 */
export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const appToast = {
  /** @param {string} message */
  success(message) {
    toast.success(message, { duration: 3000 });
  },

  /** @param {string} message @param {string} [title] */
  info(message, title) {
    toast(title ? `${title}: ${message}` : message, {
      duration: 5000,
      icon: "⏱",
    });
  },

  /** @param {unknown} error @param {string} [fallback] */
  error(error, fallback) {
    toast.error(getErrorMessage(error, fallback), { duration: 4500 });
  },

  /** @param {string} message */
  loading(message) {
    return toast.loading(message);
  },

  dismiss: toast.dismiss,
};

// ─── Velocity / accountability toast strings ──────────────────────────────────

/**
 * High-performance streak messages.
 * @param {string} name - First name of the authenticated user.
 * @param {number} pct  - Completion percentage (0–100).
 */
const HIGH_PERFORMANCE_MESSAGES = (name, pct) => [
  `Absolute Monastic Focus, ${name}! You have executed ${pct}% of your high-intent runway layout limits today.`,
  `${pct}% complete and compounding, ${name}. This is what million-dollar execution looks like — keep the window open.`,
  `Clean sweep velocity, ${name}. ${pct}% of today's intent runway locked in. The gap between you and everyone else is widening.`,
  `${name} — ${pct}% done. Your consistency index is building an unfair advantage. Stay in the chair.`,
  `Precision output, ${name}. ${pct}% of your high-intent tasks cleared. You are running on a rare operating frequency today.`,
];

/**
 * Sprint skip / task-drop friction messages.
 */
const FRICTION_MESSAGES = [
  "We notice you are bypassing this priority alignment. Consistency separates standard code from million-dollar execution templates. Let's lock back in.",
  "Skipping this block breaks compounding momentum. Your future self is watching. One more push.",
  "This task was scheduled for a reason. Drift here creates drag everywhere else. Return to intent.",
  "Priority alignment skipped. The top 1% don't negotiate with resistance — they process it. Back to the runway.",
  "Sprint paused. Every detour from your focus block costs more than the task itself. Reconnect to your execution thread.",
];

/**
 * Lightweight deterministic picker (no crypto needed, no repeats on short runs).
 * @param {string[]} pool
 * @param {number} [seed]
 */
function pickMessage(pool, seed = Date.now()) {
  return pool[seed % pool.length];
}

/**
 * Premium accountability notifications keyed to user velocity states.
 * Import and call these at task-complete / sprint-skip / batch-end call sites.
 */
export const velocityToast = {
  /**
   * Fire when a user hits a high-completion streak (≥ 60 %).
   * @param {{ name?: string; completionPct: number }} opts
   */
  highPerformance({ name = "Champion", completionPct }) {
    const pct = Math.round(completionPct);
    const messages = HIGH_PERFORMANCE_MESSAGES(name, pct);
    const message = pickMessage(messages, Math.floor(Date.now() / 60000));

    toast(message, {
      duration: 6000,
      icon: "◆",
      style: {
        background: "#1a1a1a",
        color: "#f5d97e",
        border: "1px solid rgba(245, 217, 126, 0.35)",
        borderRadius: "1rem",
        fontSize: "0.8125rem",
        fontWeight: "500",
        lineHeight: "1.5",
        maxWidth: "420px",
        boxShadow:
          "0 0 0 1px rgba(245,217,126,0.15), 0 8px 32px rgba(0,0,0,0.55), 0 0 48px rgba(245,217,126,0.08)",
        padding: "0.875rem 1.125rem",
      },
    });
  },

  /**
   * Fire when a user drops a task, skips a sprint bucket, or abandons a
   * priority block mid-session.
   */
  frictionWarning() {
    const message = pickMessage(FRICTION_MESSAGES, Math.floor(Date.now() / 30000));

    toast(message, {
      duration: 7000,
      icon: "▲",
      style: {
        background: "#ffffff",
        color: "#1a1a1a",
        border: "1px solid rgba(26,26,26,0.12)",
        borderRadius: "1rem",
        fontSize: "0.8rem",
        fontWeight: "500",
        lineHeight: "1.55",
        maxWidth: "400px",
        boxShadow:
          "0 2px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)",
        padding: "0.875rem 1.125rem",
      },
    });
  },

  /**
   * Sprint / batch session completed cleanly.
   * @param {{ name?: string; completed: number; total: number }} opts
   */
  sprintComplete({ name = "Champion", completed, total }) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const message =
      pct >= 80
        ? `Flawless execution, ${name}. ${completed}/${total} tasks cleared. That sprint goes in the record.`
        : `Sprint closed, ${name}. ${completed}/${total} done. Build on this block tomorrow.`;

    toast(message, {
      duration: 5500,
      icon: "✦",
      style: {
        background: "#1a1a1a",
        color: "#f5d97e",
        border: "1px solid rgba(245,217,126,0.3)",
        borderRadius: "1rem",
        fontSize: "0.8125rem",
        fontWeight: "500",
        lineHeight: "1.5",
        maxWidth: "380px",
        boxShadow:
          "0 0 0 1px rgba(245,217,126,0.12), 0 8px 28px rgba(0,0,0,0.5)",
        padding: "0.875rem 1.125rem",
      },
    });
  },
};
