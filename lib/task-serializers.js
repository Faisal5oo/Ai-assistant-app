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
    completedPomodoros: plain.completedPomodoros ?? 0,
    tags: plain.tags ?? [],
    createdAt:
      plain.createdAt instanceof Date
        ? plain.createdAt.toISOString()
        : plain.createdAt,
    ...(plain.completedAt
      ? {
          completedAt:
            plain.completedAt instanceof Date
              ? plain.completedAt.toISOString()
              : plain.completedAt,
        }
      : {}),
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
    ...(plain.lastWorkedAt
      ? {
          lastWorkedAt:
            plain.lastWorkedAt instanceof Date
              ? plain.lastWorkedAt.toISOString()
              : plain.lastWorkedAt,
        }
      : {}),
  };
}

/**
 * @param {import('mongoose').Document | Record<string, unknown>} doc
 * @returns {{ dailyLogs: import('@/types/interfaces').DailyTimeLog[], pomodoroDaily: import('@/types/interfaces').PomodoroDaily }}
 */
export function toClientDashboard(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;

  const session = plain.activeFocusSession;

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
    ...(session?.taskId
      ? {
          activeFocusSession: {
            taskId: session.taskId,
            isRunning: Boolean(session.isRunning),
            startedAt: session.startedAt ?? 0,
            elapsedMs: session.elapsedMs ?? 0,
            mode: session.mode ?? "work",
            ...(session.targetMs != null ? { targetMs: session.targetMs } : {}),
            activeTechnique: session.activeTechnique ?? null,
            updatedAt:
              session.updatedAt instanceof Date
                ? session.updatedAt.getTime()
                : session.updatedAt,
          },
        }
      : {}),
  };
}
