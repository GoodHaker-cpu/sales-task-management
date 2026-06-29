import { z } from "zod";
import { istDateSchema } from "./auth.validation";

export const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  category: z.string().optional(),
  assignedToId: z.string().min(1, "Assignee is required"),
  startDate: istDateSchema,
  dueDate: istDateSchema,
  estimatedHours: z.number().positive().optional(),
  remarks: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: z.string().optional(),
  assignedToId: z.string().optional(),
  startDate: istDateSchema.optional(),
  dueDate: istDateSchema.optional(),
  estimatedHours: z.number().positive().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"]).optional(),
  remarks: z.string().optional(),
});

export const assignTaskSchema = z.object({
  taskId: z.string().min(1),
  assignedToId: z.string().min(1),
});

export const completeTaskSchema = z.object({
  taskId: z.string().min(1),
  remarks: z.string().optional(),
});

export const bulkAssignSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  assignedToId: z.string().min(1),
});

export const taskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
