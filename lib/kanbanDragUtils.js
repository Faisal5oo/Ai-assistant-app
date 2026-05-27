/** @type {import('@/types/interfaces').TaskStatus[]} */
const STATUS_ORDER = ["Todo", "In-Progress", "Completed"];

/** @type {{ id: string; isPlaceholder: true }} */
export const KANBAN_PLACEHOLDER = {
  id: "__kanban-placeholder__",
  isPlaceholder: true,
};

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {import('@/types/interfaces').TaskStatus} status
 * @returns {import('@/types/interfaces').Task[]}
 */
export function tasksForStatus(tasks, status) {
  return tasks.filter((t) => t.status === status);
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {import('@/types/interfaces').TaskStatus} status
 * @param {import('@/types/interfaces').Task[]} columnTasks
 */
export function mergeColumnIntoTasks(tasks, status, columnTasks) {
  return STATUS_ORDER.flatMap((st) =>
    st === status ? columnTasks : tasks.filter((t) => t.status === st)
  );
}

/**
 * @param {import('@/types/interfaces').Task[]} withoutDragged
 * @param {number} index
 */
function insertPlaceholder(withoutDragged, index) {
  const clamped = Math.max(0, Math.min(index, withoutDragged.length));
  return [
    ...withoutDragged.slice(0, clamped),
    KANBAN_PLACEHOLDER,
    ...withoutDragged.slice(clamped),
  ];
}

/**
 * Stable per-column list while dragging — source keeps a fixed gap; hover column shows insert preview.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {import('@/types/interfaces').TaskStatus} columnStatus
 * @param {string | null} draggingTaskId
 * @param {string | null} sourceStatus
 * @param {number} sourceIndex
 * @param {string | null} hoverStatus
 * @param {number | null} hoverIndex
 */
export function buildColumnDisplayTasks(
  tasks,
  columnStatus,
  draggingTaskId,
  sourceStatus,
  sourceIndex,
  hoverStatus,
  hoverIndex
) {
  if (!draggingTaskId) return tasks;

  const isSource = columnStatus === sourceStatus;
  const isHover =
    hoverStatus != null && columnStatus === hoverStatus && hoverIndex != null;
  const withoutDragged = tasks.filter((t) => t.id !== draggingTaskId);

  if (isSource && isHover) {
    return insertPlaceholder(withoutDragged, hoverIndex);
  }

  if (isSource) {
    return insertPlaceholder(withoutDragged, sourceIndex);
  }

  if (isHover) {
    return insertPlaceholder(withoutDragged, hoverIndex);
  }

  return withoutDragged;
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @param {string | null} zoneStatus
 * @param {string | null} draggingTaskId
 * @returns {number}
 */
export function resolveDropIndex(clientX, clientY, zoneStatus, draggingTaskId) {
  if (!zoneStatus) return 0;

  const zone = document.querySelector(`[data-kanban-zone="${zoneStatus}"]`);
  if (!zone) return 0;

  const list = zone.querySelector("[data-kanban-list]");
  if (!list) return 0;

  const items = [...list.querySelectorAll("[data-kanban-task-id]")].filter(
    (el) => el.getAttribute("data-kanban-task-id") !== draggingTaskId
  );

  if (items.length === 0) return 0;

  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) return i;
  }

  return items.length;
}
