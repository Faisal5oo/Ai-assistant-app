export type TaskCategory = "Work" | "Personal" | "Learning" | "Health";
export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Todo" | "In-Progress" | "Completed";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime: number;
  actualTimeSpent: number;
  tags: string[];
  scheduledAt?: string;
  description?: string;
  createdAt: string;
}

export type TimerMode = "work" | "pomodoro" | "deep-work" | "flow";

export interface ActiveTimer {
  taskId: string | null;
  isRunning: boolean;
  startedAt: number;
  elapsedMs: number;
  mode: TimerMode;
  targetMs?: number;
}

export interface DailyTimeLog {
  date: string;
  totalMs: number;
}

export type ProductivityTechnique =
  | "pomodoro"
  | "time-blocking"
  | "deep-work"
  | "batching"
  | "eisenhower"
  | "flow";

export type ProductivityModal = "time-blocking" | "batching" | "eisenhower" | null;

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export interface PomodoroDailyProgress {
  date: string;
  completed: number;
  goal: number;
}

export interface PomodoroTimerState {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedInSet: number;
}
