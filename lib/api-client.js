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
   */
  async recordTime(id, durationMs, date) {
    const res = await fetch(`/api/tasks/${id}/time`, {
      ...defaultFetchOptions,
      method: "POST",
      body: JSON.stringify({ durationMs, ...(date ? { date } : {}) }),
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
