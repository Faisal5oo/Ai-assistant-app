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
    ...(plain.timeBlockAllocations?.length
      ? {
          timeBlockAllocations: plain.timeBlockAllocations.map((a) => ({
            date: a.date,
            hour: a.hour,
            durationMinutes: a.durationMinutes,
          })),
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
    ...(plain.batchCategory != null && plain.batchCategory !== ""
      ? { batchCategory: String(plain.batchCategory) }
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
  const deepWorkSession = plain.activeDeepWorkSession;
  const batchSprint = plain.activeBatchSprint;
  const pomodoroTimer = plain.activePomodoroTimer;
  const timeBlockRunway = plain.activeTimeBlockRunway;

  const toUpdatedAt = (value) =>
    value instanceof Date ? value.getTime() : value;

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
    ...(plain.deepWorkDaily
      ? {
          deepWorkDaily: {
            date: plain.deepWorkDaily.date,
            sessionsCompleted: plain.deepWorkDaily.sessionsCompleted ?? 0,
            breakthroughsAchieved: plain.deepWorkDaily.breakthroughsAchieved ?? 0,
          },
        }
      : {}),
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
    ...(deepWorkSession?.sessionId
      ? {
          activeDeepWorkSession: {
            sessionId: deepWorkSession.sessionId,
            taskId: deepWorkSession.taskId,
            taskTitle: deepWorkSession.taskTitle,
            objective: deepWorkSession.objective,
            durationMinutes: deepWorkSession.durationMinutes,
            phase: deepWorkSession.phase ?? "active",
            timerRunning: Boolean(deepWorkSession.timerRunning),
            timerStartedAt: deepWorkSession.timerStartedAt ?? null,
            endsAt: deepWorkSession.endsAt ?? null,
            committedAt: deepWorkSession.committedAt,
            distractions: deepWorkSession.distractions ?? [],
            updatedAt: toUpdatedAt(deepWorkSession.updatedAt),
          },
        }
      : {}),
    ...(batchSprint?.category
      ? {
          activeBatchSprint: {
            category: batchSprint.category,
            phase: batchSprint.phase,
            startedAt: batchSprint.startedAt,
            queue: batchSprint.queue ?? [],
            completedIds: batchSprint.completedIds ?? [],
            skippedCount: batchSprint.skippedCount ?? 0,
            initialQueueLength: batchSprint.initialQueueLength ?? 0,
            finalElapsedMs: batchSprint.finalElapsedMs ?? 0,
            updatedAt: toUpdatedAt(batchSprint.updatedAt),
          },
        }
      : {}),
    ...(pomodoroTimer?.sessionId
      ? {
          activePomodoroTimer: {
            sessionId: pomodoroTimer.sessionId,
            taskId: pomodoroTimer.taskId ?? null,
            phase: pomodoroTimer.phase,
            type: pomodoroTimer.type,
            secondsLeft: pomodoroTimer.secondsLeft,
            isRunning: Boolean(pomodoroTimer.isRunning),
            workMinutes: pomodoroTimer.workMinutes ?? 25,
            cycle: pomodoroTimer.cycle ?? 0,
            startedAt: pomodoroTimer.startedAt,
            timerStartedAt: pomodoroTimer.timerStartedAt ?? null,
            updatedAt: toUpdatedAt(pomodoroTimer.updatedAt),
          },
        }
      : {}),
    ...(timeBlockRunway?.date != null
      ? {
          activeTimeBlockRunway: {
            date: timeBlockRunway.date,
            hour: timeBlockRunway.hour,
            updatedAt: toUpdatedAt(timeBlockRunway.updatedAt),
          },
        }
      : {}),
  };
}
