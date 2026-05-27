import {
  Mail,
  Code2,
  FileText,
  Eye,
  Layers,
} from "lucide-react";

/** @typedef {'communication' | 'deep-execution' | 'administrative' | 'review'} PresetBatchBucketId */
/** @typedef {PresetBatchBucketId | `custom-${string}`} BatchBucketId */

/** Drop zone id for returning tasks to the quick sort pool */
export const POOL_ZONE_ID = "pool";

/** @typedef {import('@/types/interfaces').Task} Task */

/** @typedef {Object} BatchBucketDef
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} accent
 * @property {import('lucide-react').LucideIcon} Icon
 * @property {boolean} [isCustom]
 */

export const BATCH_BUCKETS = [
  {
    id: /** @type {PresetBatchBucketId} */ ("communication"),
    title: "Communication",
    subtitle: "Emails, messages, Slack updates, networking",
    accent: "from-amber-50/90 to-gold-light/40",
    Icon: Mail,
  },
  {
    id: /** @type {PresetBatchBucketId} */ ("deep-execution"),
    title: "Deep Execution",
    subtitle: "Coding features, building logic, heavy design work",
    accent: "from-cream-200/80 to-white/60",
    Icon: Code2,
  },
  {
    id: /** @type {PresetBatchBucketId} */ ("administrative"),
    title: "Administrative",
    subtitle: "Updating logs, planning, filing notes, settings",
    accent: "from-cream-100/90 to-cream-50/70",
    Icon: FileText,
  },
  {
    id: /** @type {PresetBatchBucketId} */ ("review"),
    title: "Review & Audit",
    subtitle: "Code reviews, testing, reading documentation",
    accent: "from-white/80 to-cream-200/50",
    Icon: Eye,
  },
];

/** @type {BatchBucketDef} */
export const CUSTOM_BUCKET_TEMPLATE = {
  id: "",
  title: "New Batch",
  subtitle: "Your custom task cluster",
  accent: "from-white/85 to-cream-100/70",
  Icon: Layers,
  isCustom: true,
};

/** @type {Record<PresetBatchBucketId, string[]>} */
const BUCKET_KEYWORDS = {
  communication: [
    "email",
    "message",
    "slack",
    "network",
    "meeting",
    "client",
    "call",
    "sync",
    "chat",
    "reply",
    "inbox",
    "communication",
  ],
  "deep-execution": [
    "code",
    "coding",
    "build",
    "feature",
    "design",
    "develop",
    "implement",
    "logic",
    "engineering",
    "deep",
    "execution",
    "work",
  ],
  administrative: [
    "plan",
    "planning",
    "log",
    "admin",
    "settings",
    "file",
    "errand",
    "grocery",
    "organize",
    "schedule",
    "note",
    "personal",
  ],
  review: [
    "review",
    "audit",
    "test",
    "testing",
    "read",
    "reading",
    "doc",
    "documentation",
    "qa",
    "check",
    "learning",
  ],
};

/** @type {Record<import('@/types/interfaces').TaskCategory, PresetBatchBucketId>} */
const CATEGORY_DEFAULT = {
  Work: "deep-execution",
  Learning: "review",
  Personal: "administrative",
  Health: "administrative",
};

/**
 * @param {Task} task
 * @param {Record<string, string>} overrides
 * @returns {PresetBatchBucketId}
 */
export function resolveTaskBucket(task, overrides = {}) {
  if (overrides[task.id]) {
    const id = overrides[task.id];
    if (BATCH_BUCKETS.some((b) => b.id === id)) {
      return /** @type {PresetBatchBucketId} */ (id);
    }
  }

  const haystack = [task.category, task.title, ...(task.tags ?? [])]
    .join(" ")
    .toLowerCase();

  /** @type {Record<PresetBatchBucketId, number>} */
  const scores = {
    communication: 0,
    "deep-execution": 0,
    administrative: 0,
    review: 0,
  };

  for (const [bucketId, keywords] of Object.entries(BUCKET_KEYWORDS)) {
    for (const word of keywords) {
      if (haystack.includes(word)) {
        scores[/** @type {PresetBatchBucketId} */ (bucketId)] += 1;
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) {
    return /** @type {PresetBatchBucketId} */ (best[0]);
  }

  return CATEGORY_DEFAULT[task.category] ?? "administrative";
}

/**
 * @param {BatchBucketDef[]} customBuckets
 * @param {Record<string, string>} titleOverrides
 * @returns {BatchBucketDef[]}
 */
export function getAllBuckets(customBuckets = [], titleOverrides = {}) {
  const preset = BATCH_BUCKETS.map((b) => ({
    ...b,
    title: titleOverrides[b.id]?.trim() || b.title,
  }));

  const custom = customBuckets.map((b) => ({
    ...CUSTOM_BUCKET_TEMPLATE,
    ...b,
    title: titleOverrides[b.id]?.trim() || b.title || CUSTOM_BUCKET_TEMPLATE.title,
    isCustom: true,
  }));

  return [...preset, ...custom];
}

/**
 * Explicit bucket assignments only (drag / manual). Unassigned tasks stay in the pool.
 * @param {Task[]} tasks
 * @param {Record<string, string>} overrides
 * @param {BatchBucketDef[]} customBuckets
 */
export function buildBatchLayout(tasks, overrides = {}, customBuckets = []) {
  const allBuckets = getAllBuckets(customBuckets);

  /** @type {Record<string, Task[]>} */
  const clusters = {};
  for (const bucket of allBuckets) {
    clusters[bucket.id] = [];
  }

  /** @type {Task[]} */
  const unbatched = [];

  const active = tasks.filter((t) => t.status !== "Completed");

  for (const task of active) {
    const bucketId = overrides[task.id];
    if (bucketId && clusters[bucketId]) {
      clusters[bucketId].push(task);
    } else {
      unbatched.push(task);
    }
  }

  return { clusters, unbatched };
}

/**
 * @param {string} bucketId
 * @param {BatchBucketDef[]} customBuckets
 * @param {Record<string, string>} titleOverrides
 * @returns {BatchBucketDef}
 */
export function getBucketById(bucketId, customBuckets = [], titleOverrides = {}) {
  return (
    getAllBuckets(customBuckets, titleOverrides).find((b) => b.id === bucketId) ??
    getAllBuckets()[0]
  );
}

/**
 * @param {number} completed
 * @param {number} skipped
 * @param {number} total
 */
export function computeFocusEfficiency(completed, skipped, total) {
  if (total <= 0) return 0;
  const handled = completed + skipped;
  if (handled === 0) return 0;
  const completionRatio = completed / total;
  const skipPenalty = skipped / handled;
  return Math.min(100, Math.round(completionRatio * 100 * (1 - skipPenalty * 0.35)));
}

/**
 * @returns {string}
 */
export function createCustomBucketId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
