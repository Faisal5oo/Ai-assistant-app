export const queryKeys = {
  /** @param {"today"|"archived"} [scope] */
  tasks: (scope = "today") => ["tasks", scope],
  dashboard: ["dashboard"],
  productivitySummary: ["productivity", "summary"],
  /** @param {"week"|"month"} range */
  analytics: (range) => ["analytics", range],
};
