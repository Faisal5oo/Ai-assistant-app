import { z } from "zod";

export const pomodoroSessionTypeSchema = z.enum([
  "focus",
  "short_break",
  "long_break",
]);

export const pomodoroSessionStatusSchema = z.enum(["completed", "abandoned"]);

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
});
