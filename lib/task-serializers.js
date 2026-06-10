/**
 * @param {import('mongoose').Document | Record<string, unknown>} doc
 * @returns {import('@/types/interfaces').Task}
 */
export function toClientTask(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;

  return {
    id: plain._id.toString(),
    title: plain.title,
    category: plain.category,
    priority: plain.priority,
    status: plain.status,
    estimatedTime: plain.estimatedTime,
    actualTimeSpent: plain.actualTimeSpent,
    tags: plain.tags ?? [],
    createdAt:
      plain.createdAt instanceof Date
        ? plain.createdAt.toISOString()
        : plain.createdAt,
    ...(plain.scheduledAt
      ? {
          scheduledAt:
            plain.scheduledAt instanceof Date
              ? plain.scheduledAt.toISOString()
              : plain.scheduledAt,
        }
      : {}),
    ...(plain.description ? { description: plain.description } : {}),
    ...(plain.eisenhowerQuadrant != null
      ? { eisenhowerQuadrant: plain.eisenhowerQuadrant }
      : {}),
    ...(plain.delegateTo ? { delegateTo: plain.delegateTo } : {}),
    ...(plain.automateCandidate != null
      ? { automateCandidate: plain.automateCandidate }
      : {}),
  };
}

/**
 * @param {import('mongoose').Document | Record<string, unknown>} doc
 * @returns {{ dailyLogs: import('@/types/interfaces').DailyTimeLog[], pomodoroDaily: import('@/types/interfaces').PomodoroDaily }}
 */
export function toClientDashboard(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;

  return {
    dailyLogs: (plain.dailyLogs ?? []).map((log) => ({
      date: log.date,
      totalMs: log.totalMs,
    })),
    pomodoroDaily: {
      date: plain.pomodoroDaily?.date ?? "",
      completed: plain.pomodoroDaily?.completed ?? 0,
      goal: plain.pomodoroDaily?.goal ?? 4,
    },
  };
}
