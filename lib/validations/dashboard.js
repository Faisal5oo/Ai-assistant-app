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
    deepWorkDaily: deepWorkDailySchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
