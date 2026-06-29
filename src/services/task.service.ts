import { taskRepository } from "@/repositories/task.repository";
import { userRepository } from "@/repositories/user.repository";
import { notificationService } from "@/services/notification.service";
import { activityRepository } from "@/repositories/notification.repository";
import { AppError } from "@/lib/api-response";
import {
  generateTaskId,
  getCurrentISTDateTime,
  isTaskOverdue,
  compareISTDates,
} from "@/lib/utils";
import {
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  BulkAssignInput,
} from "@/validations/task.validation";
import { SessionUser, TaskFilters, DashboardStats } from "@/types";
import { TaskStatus } from "@prisma/client";

export class TaskService {
  async createTask(input: CreateTaskInput, actor: SessionUser, ipAddress?: string) {
    if (actor.role === "SALESMAN") {
      throw new AppError("Salesmen cannot create tasks", 403);
    }

    const assignee = await userRepository.findById(input.assignedToId);
    if (!assignee || assignee.role !== "SALESMAN") {
      throw new AppError("Invalid assignee", 400);
    }

    if (actor.role === "MANAGER" && assignee.managerId !== actor.id) {
      throw new AppError("Can only assign tasks to your team members", 403);
    }

    if (compareISTDates(input.dueDate, input.startDate) < 0) {
      throw new AppError("Due date must be after start date", 400);
    }

    const now = getCurrentISTDateTime();
    const task = await taskRepository.create({
      taskId: generateTaskId(),
      title: input.title,
      description: input.description,
      priority: input.priority,
      category: input.category,
      assignedById: actor.id,
      assignedToId: input.assignedToId,
      startDate: input.startDate,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      remarks: input.remarks,
      createdAt: now,
      updatedAt: now,
    });

    await activityRepository.create({
      userId: actor.id,
      action: "TASK_CREATED",
      details: `Created task ${task.taskId}: ${task.title}`,
      ipAddress,
      createdAt: now,
    });

    await notificationService.notifyTaskAssigned(task.id, input.assignedToId, task.title);

    return task;
  }

  async updateTask(id: string, input: UpdateTaskInput, actor: SessionUser, ipAddress?: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError("Task not found", 404);

    this.assertCanAccessTask(actor, task);

    if (actor.role === "SALESMAN" && input.status && !["IN_PROGRESS", "COMPLETED"].includes(input.status)) {
      throw new AppError("Salesmen can only update status to In Progress or Completed", 403);
    }

    const now = getCurrentISTDateTime();
    const updateData: Record<string, unknown> = { ...input, updatedAt: now };

    if (input.status === "COMPLETED") {
      updateData.completionDate = now;
      updateData.isOverdue = compareISTDates(now, task.dueDate) > 0;
    }

    if (input.dueDate && input.startDate && compareISTDates(input.dueDate, input.startDate) < 0) {
      throw new AppError("Due date must be after start date", 400);
    }

    const updated = await taskRepository.update(id, updateData);

    await activityRepository.create({
      userId: actor.id,
      action: "TASK_UPDATED",
      details: `Updated task ${updated.taskId}`,
      ipAddress,
      createdAt: now,
    });

    if (input.status === "COMPLETED") {
      await notificationService.notifyTaskCompleted(updated.id, updated.assignedById, updated.title);
    }

    return updated;
  }

  async deleteTask(id: string, actor: SessionUser, ipAddress?: string) {
    if (actor.role === "SALESMAN") throw new AppError("Access denied", 403);

    const task = await taskRepository.findById(id);
    if (!task) throw new AppError("Task not found", 404);

    if (actor.role === "MANAGER" && task.assignedById !== actor.id) {
      throw new AppError("Can only delete tasks you created", 403);
    }

    await taskRepository.delete(id);

    const now = getCurrentISTDateTime();
    await activityRepository.create({
      userId: actor.id,
      action: "TASK_DELETED",
      details: `Deleted task ${task.taskId}`,
      ipAddress,
      createdAt: now,
    });

    return { message: "Task deleted successfully" };
  }

  async assignTask(taskId: string, assignedToId: string, actor: SessionUser, ipAddress?: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    if (actor.role === "SALESMAN") throw new AppError("Access denied", 403);

    const assignee = await userRepository.findById(assignedToId);
    if (!assignee || assignee.role !== "SALESMAN") {
      throw new AppError("Invalid assignee", 400);
    }

    if (actor.role === "MANAGER" && assignee.managerId !== actor.id) {
      throw new AppError("Can only assign to your team members", 403);
    }

    const now = getCurrentISTDateTime();
    const updated = await taskRepository.update(taskId, {
      assignedToId,
      updatedAt: now,
    });

    await activityRepository.create({
      userId: actor.id,
      action: "TASK_ASSIGNED",
      details: `Reassigned task ${updated.taskId} to ${assignee.name}`,
      ipAddress,
      createdAt: now,
    });

    await notificationService.notifyTaskAssigned(taskId, assignedToId, updated.title);

    return updated;
  }

  async completeTask(input: CompleteTaskInput, actor: SessionUser, ipAddress?: string) {
    const task = await taskRepository.findById(input.taskId);
    if (!task) throw new AppError("Task not found", 404);

    if (task.assignedToId !== actor.id && actor.role === "SALESMAN") {
      throw new AppError("Can only complete your own tasks", 403);
    }

    const now = getCurrentISTDateTime();
    const completedLate = compareISTDates(now, task.dueDate) > 0;
    const updated = await taskRepository.update(input.taskId, {
      status: "COMPLETED",
      completionDate: now,
      isOverdue: completedLate,
      remarks: input.remarks || task.remarks,
      updatedAt: now,
    });

    await activityRepository.create({
      userId: actor.id,
      action: "TASK_COMPLETED",
      details: `Completed task ${updated.taskId}`,
      ipAddress,
      createdAt: now,
    });

    await notificationService.notifyTaskCompleted(updated.id, updated.assignedById, updated.title);

    return updated;
  }

  async bulkAssign(input: BulkAssignInput, actor: SessionUser, ipAddress?: string) {
    if (actor.role === "SALESMAN") throw new AppError("Access denied", 403);

    const assignee = await userRepository.findById(input.assignedToId);
    if (!assignee || assignee.role !== "SALESMAN") {
      throw new AppError("Invalid assignee", 400);
    }

    const now = getCurrentISTDateTime();
    await taskRepository.bulkUpdateAssignee(input.taskIds, input.assignedToId, now);

    for (const taskId of input.taskIds) {
      const task = await taskRepository.findById(taskId);
      if (task) {
        await notificationService.notifyTaskAssigned(taskId, input.assignedToId, task.title);
      }
    }

    await activityRepository.create({
      userId: actor.id,
      action: "BULK_TASK_ASSIGNED",
      details: `Bulk assigned ${input.taskIds.length} tasks to ${assignee.name}`,
      ipAddress,
      createdAt: now,
    });

    return { message: `${input.taskIds.length} tasks assigned successfully` };
  }

  async getTasks(filters: TaskFilters, actor: SessionUser) {
    if (actor.role === "SALESMAN") {
      filters.assignedToId = actor.id;
    } else if (actor.role === "MANAGER") {
      if (!filters.assignedToId) {
        const teamIds = await userRepository.getSalesmenIdsByManager(actor.id);
        // Manager sees tasks they created or assigned to their team
        filters.assignedById = actor.id;
      }
    }

    await taskRepository.updateOverdueStatus();
    return taskRepository.findMany(filters);
  }

  async getTaskById(id: string, actor: SessionUser) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError("Task not found", 404);

    this.assertCanAccessTask(actor, task);

    if (isTaskOverdue(task.dueDate, task.status) && task.status !== "COMPLETED") {
      return {
        ...task,
        status: "OVERDUE" as TaskStatus,
        isOverdue: true,
        overdueMessage: "Task Not Completed Within Timeline",
      };
    }

    return task;
  }

  async getDashboardStats(actor: SessionUser): Promise<DashboardStats> {
    await taskRepository.updateOverdueStatus();

    if (actor.role === "ADMIN") {
      const [totalManagers, totalSalesmen, totalTasks, completedTasks, pendingTasks, overdueTasks] =
        await Promise.all([
          userRepository.countByRole("MANAGER"),
          userRepository.countByRole("SALESMAN"),
          taskRepository.countByStatus(),
          taskRepository.countByStatus("COMPLETED"),
          taskRepository.countByStatus("PENDING"),
          taskRepository.countByStatus("OVERDUE"),
        ]);

      return { totalManagers, totalSalesmen, totalTasks, completedTasks, pendingTasks, overdueTasks };
    }

    if (actor.role === "MANAGER") {
      const teamIds = await userRepository.getSalesmenIdsByManager(actor.id);
      const [totalTeamMembers, assignedTasks, completedTasks, pendingTasks, overdueTasks] =
        await Promise.all([
          teamIds.length,
          taskRepository.countByStatus(undefined, { assignedById: actor.id }),
          taskRepository.countByStatus("COMPLETED", { assignedById: actor.id }),
          taskRepository.countByStatus("PENDING", { assignedById: actor.id }),
          taskRepository.countByStatus("OVERDUE", { assignedById: actor.id }),
        ]);

      return {
        totalTeamMembers,
        assignedTasks,
        totalTasks: assignedTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      };
    }

    const [assignedTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      taskRepository.countByStatus(undefined, { assignedToId: actor.id }),
      taskRepository.countByStatus("COMPLETED", { assignedToId: actor.id }),
      taskRepository.countByStatus("PENDING", { assignedToId: actor.id }),
      taskRepository.countByStatus("OVERDUE", { assignedToId: actor.id }),
    ]);

    return { assignedTasks, totalTasks: assignedTasks, completedTasks, pendingTasks, overdueTasks };
  }

  private assertCanAccessTask(
    actor: SessionUser,
    task: { assignedToId: string; assignedById: string }
  ) {
    if (actor.role === "ADMIN") return;
    if (actor.role === "SALESMAN" && task.assignedToId === actor.id) return;
    if (actor.role === "MANAGER" && task.assignedById === actor.id) return;
    throw new AppError("Access denied", 403);
  }
}

export const taskService = new TaskService();
