const defaultFetchOptions = {
  credentials: "include",
  headers: { "Content-Type": "application/json" },
};

/**
 * @param {Response} res
 */
async function parseJson(res) {
  return res.json().catch(() => ({}));
}

/**
 * @param {Response} res
 * @param {Record<string, unknown>} data
 */
function apiError(res, data) {
  const error = new Error(
    typeof data.error === "string" ? data.error : "Request failed."
  );
  error.status = res.status;
  throw error;
}

export const tasksApi = {
  /** @returns {Promise<{ tasks: import('@/types/interfaces').Task[] }>} */
  async list() {
    const res = await fetch("/api/tasks", defaultFetchOptions);
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { tasks: data.tasks ?? [] };
  },

  /** @param {Record<string, unknown>} payload */
  async create(payload) {
    const res = await fetch("/api/tasks", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { task: data.task };
  },

  /**
   * @param {string} id
   * @param {Record<string, unknown>} updates
   */
  async update(id, updates) {
    const res = await fetch(`/api/tasks/${id}`, {
      ...defaultFetchOptions,
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { task: data.task };
  },

  /** @param {string} id */
  async remove(id) {
    const res = await fetch(`/api/tasks/${id}`, {
      ...defaultFetchOptions,
      method: "DELETE",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { success: true };
  },

  /**
   * @param {{
   *   columnId: import('@/types/interfaces').TaskStatus;
   *   taskIds: string[];
   *   sourceColumnId?: import('@/types/interfaces').TaskStatus;
   *   sourceTaskIds?: string[];
   * }} payload
   */
  async reorder(payload) {
    const res = await fetch("/api/tasks/reorder", {
      ...defaultFetchOptions,
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { success: true };
  },

  /**
   * @param {string} id
   * @param {number} durationMs
   * @param {string} [date]
   * @param {{ startedAt?: string, stoppedAt?: string }} [interval]
   */
  async recordTime(id, durationMs, date, interval = {}) {
    const res = await fetch(`/api/tasks/${id}/time`, {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify({
        durationMs,
        ...(date ? { date } : {}),
        ...(interval.startedAt ? { startedAt: interval.startedAt } : {}),
        ...(interval.stoppedAt ? { stoppedAt: interval.stoppedAt } : {}),
      }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { task: data.task, dailyLogs: data.dailyLogs ?? [] };
  },
};

export const dashboardApi = {
  async get() {
    const res = await fetch("/api/dashboard", defaultFetchOptions);
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { dashboard: data.dashboard };
  },

  /** @returns {Promise<{ dashboard: Record<string, unknown>, activeTimeBlock: object | null }>} */
  async getWorkspace() {
    const res = await fetch("/api/dashboard", defaultFetchOptions);
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      dashboard: data.dashboard,
      activeTimeBlock: data.activeTimeBlock ?? null,
    };
  },

  /** @param {Record<string, unknown>} payload */
  async update(payload) {
    const res = await fetch("/api/dashboard", {
      ...defaultFetchOptions,
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { dashboard: data.dashboard };
  },
};

export const analyticsApi = {
  /**
   * @param {"week"|"month"} range
   * @returns {Promise<{ analytics: import('@/lib/analytics-pipeline').AnalyticsPayload }>}
   */
  async get(range = "week") {
    const res = await fetch(`/api/analytics?range=${range}`, defaultFetchOptions);
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { analytics: data.analytics };
  },
};

export const productivityApi = {
  /** @returns {Promise<{ summary: import('@/types/interfaces').ProductivitySummary }>} */
  async getSummary() {
    const res = await fetch("/api/productivity/analytics/summary", defaultFetchOptions);
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { summary: data.summary };
  },

  /**
   * @param {{ taskId?: string | null, type?: import('@/types/interfaces').PomodoroSessionType, plannedDurationMinutes?: number }} payload
   */
  async startSession(payload) {
    const res = await fetch("/api/productivity/pomodoro/session/start", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      session: data.session,
      task: data.task ?? null,
    };
  },

  /**
   * @param {{
   *   taskId?: string | null;
   *   type: import('@/types/interfaces').PomodoroSessionType;
   *   duration: number;
   *   status: import('@/types/interfaces').PomodoroSessionStatus;
   *   sessionStartedAt?: string;
   * }} payload
   */
  async endSession(payload) {
    const res = await fetch("/api/productivity/pomodoro/session/end", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      sessionLog: data.sessionLog,
      task: data.task ?? null,
      dailyLogs: data.dailyLogs ?? null,
    };
  },

  /** @param {string} taskId */
  async completeTask(taskId) {
    const res = await fetch("/api/productivity/tasks/complete", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify({ taskId }),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { task: data.task };
  },

  /**
   * @param {{ taskId: string, hour: number, date?: string }} payload
   */
  async allocateBlock(payload) {
    const res = await fetch("/api/productivity/time-blocking/allocate", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      task: data.task,
      allocation: data.allocation,
      remainingMinutes: data.remainingMinutes,
    };
  },

  /**
   * @param {{ taskId: string, hour: number, date?: string }} payload
   */
  async deallocateBlock(payload) {
    const res = await fetch("/api/productivity/time-blocking/allocate", {
      ...defaultFetchOptions,
      method: "DELETE",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      task: data.task,
      remainingMinutes: data.remainingMinutes,
    };
  },

  /**
   * @param {{ taskId: string, objective: string, plannedDurationMinutes: number }} payload
   */
  async startDeepWorkSession(payload) {
    const res = await fetch("/api/productivity/deep-work/session/start", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      session: data.session,
      task: data.task,
    };
  },

  /**
   * @param {{
   *   taskId?: string | null;
   *   objective: string;
   *   plannedDurationMinutes: number;
   *   actualDurationMinutes: number;
   *   objectiveAchieved: boolean;
   *   status: import('@/types/interfaces').DeepWorkSessionStatus;
   *   sessionStartedAt?: string;
   * }} payload
   */
  async endDeepWorkSession(payload) {
    const res = await fetch("/api/productivity/deep-work/session/end", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return {
      sessionLog: data.sessionLog,
      task: data.task ?? null,
      dailyLogs: data.dailyLogs ?? null,
      deepWorkDaily: data.deepWorkDaily ?? null,
    };
  },

  /**
   * @param {{ taskId: string, batchCategory: string | null }} payload
   */
  async updateBatchCategory(payload) {
    const res = await fetch("/api/productivity/task-batching/category", {
      ...defaultFetchOptions,
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { task: data.task };
  },

  /**
   * @param {{
   *   batchCategory: string;
   *   bucketTitle: string;
   *   sessionStartedAt: string;
   *   durationMs: number;
   *   tasksTotal: number;
   *   tasksCompleted: number;
   *   tasksSkipped: number;
   *   focusEfficiency: number;
   *   status: 'completed' | 'abandoned';
   * }} payload
   */
  async endBatchSprint(payload) {
    const res = await fetch("/api/productivity/task-batching/sprint/end", {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await parseJson(res);
    if (!res.ok || !data.success) apiError(res, data);
    return { sessionLog: data.sessionLog };
  },
};

/**
 * @returns {Promise<{ tasks: import('@/types/interfaces').Task[], dailyLogs: import('@/types/interfaces').DailyTimeLog[], pomodoroDaily: import('@/types/interfaces').PomodoroDaily }>}
 */
export async function loadUserData() {
  const [tasksResult, dashboardResult] = await Promise.all([
    tasksApi.list(),
    dashboardApi.get(),
  ]);

  return {
    tasks: tasksResult.tasks,
    dailyLogs: dashboardResult.dashboard.dailyLogs,
    pomodoroDaily: dashboardResult.dashboard.pomodoroDaily,
  };
}
