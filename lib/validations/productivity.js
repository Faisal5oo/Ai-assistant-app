import { z } from "zod";

export const pomodoroSessionTypeSchema = z.enum([
  "focus",
  "short_break",
  "long_break",
]);

export const pomodoroSessionStatusSchema = z.enum(["completed", "abandoned"]);

/** Shared wellness micro-habit check captured at session close */
export const wellnessCheckSchema = z
  .object({
    tookHydrationBreak: z.boolean().optional(),
    stretchedDuringInterval: z.boolean().optional(),
    avoidedPhoneDistraction: z.boolean().optional(),
  })
  .optional();

export const startPomodoroSessionSchema = z.object({
  taskId: z.string().min(1).optional().nullable(),
  type: pomodoroSessionTypeSchema.default("focus"),
  plannedDurationMinutes: z.number().int().min(1).max(180).optional(),
});

export const endPomodoroSessionSchema = z.object({
  taskId: z.string().min(1).optional().nullable(),
  type: pomodoroSessionTypeSchema,
  duration: z.number().min(0).max(24 * 60),
  status: pomodoroSessionStatusSchema,
  sessionStartedAt: z.string().datetime().optional(),
  wellness: wellnessCheckSchema,
});

export const completeTaskSchema = z.object({
  taskId: z.string().min(1, "Task id is required."),
});

export const deepWorkSessionStatusSchema = z.enum(["completed", "abandoned"]);

export const deepWorkAbandonReasonSchema = z.enum([
  "cognitive_depletion",
  "external_friction",
  "dopamine_pull",
]);

export const startDeepWorkSessionSchema = z.object({
  taskId: z.string().min(1, "Task id is required."),
  objective: z.string().trim().min(1).max(200),
  plannedDurationMinutes: z.number().int().min(60).max(120),
});

export const updateBatchCategorySchema = z.object({
  taskId: z.string().min(1, "Task id is required."),
  batchCategory: z
    .union([
      z.enum(["communication", "deep-execution", "administrative", "review"]),
      z.string().regex(/^custom-/),
    ])
    .nullable(),
});

export const endBatchSprintSchema = z.object({
  batchCategory: z.string().min(1).max(64),
  bucketTitle: z.string().trim().min(1).max(100),
  sessionStartedAt: z.string().datetime(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  tasksTotal: z.number().int().min(0).max(500),
  tasksCompleted: z.number().int().min(0).max(500),
  tasksSkipped: z.number().int().min(0).max(500),
  focusEfficiency: z.number().int().min(0).max(100),
  status: z.enum(["completed", "abandoned"]),
});

export const endDeepWorkSessionSchema = z.object({
  taskId: z.string().min(1).optional().nullable(),
  objective: z.string().trim().min(1).max(200),
  plannedDurationMinutes: z.number().int().min(1).max(180),
  actualDurationMinutes: z.number().min(0).max(24 * 60),
  objectiveAchieved: z.boolean().default(false),
  status: deepWorkSessionStatusSchema,
  sessionStartedAt: z.string().datetime().optional(),
  abandonReason: deepWorkAbandonReasonSchema.optional(),
  completedEarly: z.boolean().optional(),
  minutesSaved: z.number().min(0).max(180).optional(),
  completeTask: z.boolean().optional(),
  wellness: wellnessCheckSchema,
});
