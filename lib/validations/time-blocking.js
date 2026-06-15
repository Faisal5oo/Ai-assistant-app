import { z } from "zod";

export const timeBlockHourSchema = z.number().int().min(0).max(23);

export const allocateTimeBlockSchema = z.object({
  taskId: z.string().min(1, "Task id is required."),
  hour: timeBlockHourSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd")
    .optional(),
});

export const deallocateTimeBlockSchema = z.object({
  taskId: z.string().min(1, "Task id is required."),
  hour: timeBlockHourSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd")
    .optional(),
});
