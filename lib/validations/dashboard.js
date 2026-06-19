import { z } from "zod";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd");

export const dailyTimeLogSchema = z.object({
  date: dateKeySchema,
  totalMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
});

export const pomodoroDailySchema = z.object({
  date: dateKeySchema,
  completed: z.number().int().min(0).max(100),
  goal: z.number().int().min(1).max(50),
});

const activeFocusSessionSchema = z.object({
  taskId: z.string().min(1),
  isRunning: z.boolean(),
  startedAt: z.number().int().min(0),
  elapsedMs: z.number().int().min(0),
  mode: z.enum(["work", "pomodoro", "deep-work", "flow"]).optional(),
  targetMs: z.number().int().positive().optional(),
  activeTechnique: z.string().nullable().optional(),
  updatedAt: z.number().int().positive().optional(),
});

const activeDeepWorkSessionSchema = z.object({
  sessionId: z.string().min(1),
  taskId: z.string().min(1),
  taskTitle: z.string().min(1),
  objective: z.string().min(1).max(200),
  durationMinutes: z.number().int().min(60).max(120),
  phase: z.enum(["active", "recap"]),
  timerRunning: z.boolean(),
  timerStartedAt: z.number().int().min(0).nullable(),
  endsAt: z.number().int().min(0).nullable(),
  committedAt: z.number().int().positive(),
  distractions: z.array(z.string()).optional(),
  updatedAt: z.number().int().positive().optional(),
});

export const deepWorkDailySchema = z.object({
  date: dateKeySchema,
  sessionsCompleted: z.number().int().min(0).max(100),
  breakthroughsAchieved: z.number().int().min(0).max(100),
});

const activeBatchSprintSchema = z.object({
  category: z.string().min(1).max(64),
  phase: z.enum(["execution", "recap"]),
  startedAt: z.number().int().positive(),
  queue: z.array(z.string()).default([]),
  completedIds: z.array(z.string()).default([]),
  skippedCount: z.number().int().min(0).default(0),
  initialQueueLength: z.number().int().min(0).default(0),
  finalElapsedMs: z.number().int().min(0).optional(),
  updatedAt: z.number().int().positive().optional(),
});

const activePomodoroTimerSchema = z.object({
  sessionId: z.string().min(1),
  taskId: z.string().nullable().optional(),
  phase: z.enum(["work", "shortBreak", "longBreak"]),
  type: z.enum(["focus", "short_break", "long_break"]),
  secondsLeft: z.number().int().min(0),
  isRunning: z.boolean(),
  workMinutes: z.number().int().min(1).max(180).optional(),
  cycle: z.number().int().min(0).optional(),
  startedAt: z.string().datetime(),
  timerStartedAt: z.number().int().min(0).nullable().optional(),
  updatedAt: z.number().int().positive().optional(),
});

const activeTimeBlockRunwaySchema = z.object({
  date: dateKeySchema,
  hour: z.number().int().min(0).max(23),
  updatedAt: z.number().int().positive().optional(),
});

const activeFlowSessionSchema = z.object({
  primaryTaskId: z.string().min(1),
  primaryTaskTitle: z.string().min(1).max(200),
  targetTaskIds: z.array(z.string()).default([]),
  runwayQueue: z.array(z.string()).default([]),
  durationMinutes: z.number().int().min(1).max(180),
  startedAt: z.number().int().positive(),
  updatedAt: z.number().int().positive().optional(),
});

export const updateDashboardSchema = z
  .object({
    addDailyMs: z.object({
      date: dateKeySchema,
      ms: z.number().int().positive().max(24 * 60 * 60 * 1000),
    }),
    pomodoroDaily: pomodoroDailySchema,
    pomodoroIncrement: z.object({
      date: dateKeySchema,
      goal: z.number().int().min(1).max(50).optional(),
    }),
    activeFocusSession: activeFocusSessionSchema.nullable(),
    activeDeepWorkSession: activeDeepWorkSessionSchema.nullable(),
    activeBatchSprint: activeBatchSprintSchema.nullable(),
    activePomodoroTimer: activePomodoroTimerSchema.nullable(),
    activeTimeBlockRunway: activeTimeBlockRunwaySchema.nullable(),
    activeFlowSession: activeFlowSessionSchema.nullable(),
    deepWorkDaily: deepWorkDailySchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
