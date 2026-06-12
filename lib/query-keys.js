export const queryKeys = {
  tasks: ["tasks"],
  dashboard: ["dashboard"],
  productivitySummary: ["productivity", "summary"],
  /** @param {"week"|"month"} range */
  analytics: (range) => ["analytics", range],
};
