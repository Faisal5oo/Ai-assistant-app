/**
 * @typedef {'Work' | 'Personal' | 'Learning' | 'Health'} TaskCategory
 */

/**
 * @typedef {'Low' | 'Medium' | 'High'} TaskPriority
 */

/**
 * @typedef {'Todo' | 'In-Progress' | 'Completed'} TaskStatus
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {TaskCategory} category
 * @property {TaskPriority} priority
 * @property {TaskStatus} status
 * @property {number} estimatedTime - minutes
 * @property {number} actualTimeSpent - milliseconds
 * @property {string[]} tags
 * @property {string} [scheduledAt] - ISO date string for timeline
 * @property {string} [description]
 * @property {string} createdAt
 * @property {EisenhowerQuadrant} [eisenhowerQuadrant] - explicit matrix placement
 * @property {string} [delegateTo] - Q3 delegate assignee label
 * @property {boolean} [automateCandidate] - Q3 automation flag
 */

/**
 * @typedef {Object} ActiveTimer
 * @property {string | null} taskId
 * @property {boolean} isRunning
 * @property {number} startedAt - timestamp when current session started
 * @property {number} elapsedMs - accumulated ms in current session before pause
 * @property {'work' | 'pomodoro' | 'deep-work' | 'flow'} mode
 * @property {number} [targetMs] - optional target for technique timers
 */

/**
 * @typedef {Object} DailyTimeLog
 * @property {string} date - yyyy-MM-dd
 * @property {number} totalMs
 */

/**
 * @typedef {'pomodoro' | 'time-blocking' | 'deep-work' | 'batching' | 'eisenhower' | 'flow'} ProductivityTechnique
 */

/**
 * @typedef {'time-blocking' | 'batching' | 'eisenhower' | null} ProductivityModal
 */

/**
 * @typedef {Object} TechniqueCardConfig
 * @property {ProductivityTechnique} id
 * @property {string} title
 * @property {string} description
 * @property {import('lucide-react').LucideIcon} icon
 * @property {string} actionLabel
 * @property {'timer' | 'modal'} actionType
 * @property {string} [href]
 * @property {number} [targetMs]
 */

/**
 * @typedef {1 | 2 | 3 | 4} EisenhowerQuadrant
 */

/**
 * @typedef {Object} PomodoroDaily
 * @property {string} date - yyyy-MM-dd
 * @property {number} completed
 * @property {number} goal
 */

export const CATEGORIES = /** @type {const} */ (["Work", "Personal", "Learning", "Health"]);
export const PRIORITIES = /** @type {const} */ (["Low", "Medium", "High"]);
export const STATUSES = /** @type {const} */ (["Todo", "In-Progress", "Completed"]);
