export type TaskCategory = "Work" | "Personal" | "Learning" | "Health";
export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Todo" | "In-Progress" | "Completed";

export interface TimeBlockAllocation {
  date: string;
  hour: number;
  durationMinutes: number;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime: number;
  actualTimeSpent: number;
  completedPomodoros: number;
  tags: string[];
  scheduledAt?: string;
  timeBlockAllocations?: TimeBlockAllocation[];
  description?: string;
  createdAt: string;
  lastWorkedAt?: string;
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

export interface PersistedFocusSession {
  taskId: string;
  isRunning: boolean;
  startedAt: number;
  elapsedMs: number;
  mode?: TimerMode;
  targetMs?: number;
  activeTechnique?: ProductivityTechnique | null;
  updatedAt?: number;
}

export interface DashboardData {
  dailyLogs: DailyTimeLog[];
  pomodoroDaily: PomodoroDailyProgress;
  activeFocusSession?: PersistedFocusSession | null;
}

export interface PomodoroTimerState {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  completedInSet: number;
}

export type PomodoroSessionType = "focus" | "short_break" | "long_break";
export type PomodoroSessionStatus = "completed" | "abandoned";
export type DeepWorkSessionStatus = "completed" | "abandoned";
export type DeepWorkAbandonReason =
  | "cognitive_depletion"
  | "external_friction"
  | "dopamine_pull";

export interface DeepWorkDaily {
  date: string;
  sessionsCompleted: number;
  breakthroughsAchieved: number;
}

export interface ActivePomodoroSession {
  id: string;
  taskId: string | null;
  type: PomodoroSessionType;
  startedAt: string;
  plannedDurationMinutes?: number;
}

export interface ProductivitySummary {
  focusHours: {
    today: number;
    todayMinutes: number;
    rollingSevenDay: Array<{
      date: string;
      focusMinutes: number;
      focusHours: number;
      completed: number;
      abandoned: number;
    }>;
  };
  sessionCompletion: {
    completed: number;
    abandoned: number;
    completionRatio: number | null;
  };
  estimationBias: {
    completedTaskCount: number;
    totalEstimatedMinutes: number;
    totalEstimatedHours: number;
    totalActualMs: number;
    totalActualHours: number;
    deltaMs: number;
    deltaPct: number | null;
    accuracyScore: number | null;
  };
  deepWork: {
    todaySessions: number;
    todayBreakthroughs: number;
    breakthroughAccuracy: number | null;
    currentStreak: number;
    earlyCompletions: number;
    totalMinutesSaved: number;
    energyCycles: {
      cognitiveDepletion: number;
      externalFriction: number;
      dopaminePull: number;
      total: number;
    };
    rollingSevenDay: Array<{
      date: string;
      focusMinutes: number;
      sessions: number;
      breakthroughs: number;
    }>;
  };
  generatedAt: string;
}
