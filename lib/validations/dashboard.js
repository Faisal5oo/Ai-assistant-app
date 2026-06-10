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
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
