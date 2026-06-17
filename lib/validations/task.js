import { z } from "zod";

export const timeBlockAllocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(23),
  durationMinutes: z.number().int().min(1).max(60),
});

export const taskCategorySchema = z.enum([
  "Work",
  "Personal",
  "Learning",
  "Health",
]);

export const taskPrioritySchema = z.enum(["Low", "Medium", "High"]);

export const taskStatusSchema = z.enum(["Todo", "In-Progress", "Completed"]);

export const eisenhowerQuadrantSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const batchCategorySchema = z
  .union([
    z.enum(["communication", "deep-execution", "administrative", "review"]),
    z.string().regex(/^custom-/, "Custom batch ids must start with custom-"),
  ])
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: taskCategorySchema,
  priority: taskPrioritySchema,
  estimatedTime: z.number().int().min(1).max(24 * 60).optional().default(30),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
  scheduledAt: z.string().datetime().optional(),
  description: z.string().trim().max(2000).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    category: taskCategorySchema,
    priority: taskPrioritySchema,
    status: taskStatusSchema,
    estimatedTime: z.number().int().min(1).max(24 * 60),
    actualTimeSpent: z.number().int().min(0),
    completedPomodoros: z.number().int().min(0),
    lastWorkedAt: z.string().datetime().nullable(),
    tags: z.array(z.string().trim().max(50)).max(20),
    scheduledAt: z.string().datetime().nullable(),
    timeBlockAllocations: z.array(timeBlockAllocationSchema),
    description: z.string().trim().max(2000).nullable(),
    eisenhowerQuadrant: eisenhowerQuadrantSchema.nullable(),
    delegateTo: z.string().trim().max(100).nullable(),
    automateCandidate: z.boolean().nullable(),
    sortOrder: z.number().int().min(0),
    batchCategory: batchCategorySchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const reorderTasksSchema = z.object({
  columnId: taskStatusSchema,
  taskIds: z.array(z.string().min(1)).min(1).max(500),
  sourceColumnId: taskStatusSchema.optional(),
  sourceTaskIds: z.array(z.string().min(1)).max(500).optional(),
});

export const addTimeSchema = z.object({
  durationMs: z.number().int().positive().max(24 * 60 * 60 * 1000),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd")
    .optional(),
  startedAt: z.string().datetime().optional(),
  stoppedAt: z.string().datetime().optional(),
});
