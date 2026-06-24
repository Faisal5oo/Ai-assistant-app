import { z } from "zod";

export const taskListQuerySchema = z.object({
  scope: z.enum(["today", "archived"]).default("today"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd")
    .optional(),
  tzOffset: z.coerce.number().int().min(-840).max(840).optional(),
});
