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
