import { prisma } from "@/lib/prisma";
import { insertDoc, updateDocById, deleteDocById, updateManyDocs } from "@/lib/mongo-native";
import { TaskFilters, PaginatedResult } from "@/types";
import { Task, Prisma, TaskStatus } from "@prisma/client";

export interface CreateTaskData {
  taskId: string;
  title: string;
  description?: string;
  priority: string;
  category?: string;
  assignedById: string;
  assignedToId: string;
  startDate: string;
  dueDate: string;
  estimatedHours?: number;
  remarks?: string;
  status?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class TaskRepository {
  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    });
  }

  async findByTaskId(taskId: string) {
    return prisma.task.findUnique({ where: { taskId } });
  }

  async create(data: CreateTaskData): Promise<Task> {
    const doc = await insertDoc("Task", {
      ...data,
      status: data.status || "PENDING",
      isOverdue: data.isOverdue ?? false,
    });
    return doc as unknown as Task;
  }

  async update(id: string, data: Record<string, unknown>): Promise<Task> {
    const doc = await updateDocById("Task", id, data);
    return doc as unknown as Task;
  }

  async delete(id: string): Promise<Task> {
    const doc = await deleteDocById("Task", id);
    return doc as unknown as Task;
  }

  async findMany(filters: TaskFilters): Promise<PaginatedResult<Task>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category) where.category = filters.category;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.assignedById) where.assignedById = filters.assignedById;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { taskId: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy as keyof Task] = filters.sortOrder || "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async countByStatus(status?: TaskStatus, filters?: Partial<TaskFilters>): Promise<number> {
    const where: Prisma.TaskWhereInput = {};
    if (status) where.status = status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.assignedById) where.assignedById = filters.assignedById;
    return prisma.task.count({ where });
  }

  async countByAssigneeIds(assigneeIds: string[], status?: TaskStatus): Promise<number> {
    const where: Prisma.TaskWhereInput = {
      assignedToId: { in: assigneeIds },
    };
    if (status) where.status = status;
    return prisma.task.count({ where });
  }

  async getOverdueTasks(filters?: Partial<TaskFilters>) {
    const where: Prisma.TaskWhereInput = {
      isOverdue: true,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    };
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.assignedById) where.assignedById = filters.assignedById;

    return prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateOverdueStatus() {
    const tasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        isOverdue: false,
      },
    });

    const { getCurrentISTDateTime, compareISTDates } = await import("@/lib/utils");
    const now = getCurrentISTDateTime();

    for (const task of tasks) {
      if (compareISTDates(now, task.dueDate) > 0) {
        await this.update(task.id, { status: "OVERDUE", isOverdue: true, updatedAt: now });
      }
    }
  }

  async getTasksByAssignee(assigneeId: string, status?: TaskStatus) {
    const where: Prisma.TaskWhereInput = { assignedToId: assigneeId };
    if (status) where.status = status;
    return prisma.task.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
  }

  async bulkUpdateAssignee(taskIds: string[], assignedToId: string, updatedAt: string) {
    return updateManyDocs("Task", { id: { in: taskIds } }, { assignedToId, updatedAt });
  }
}

export const taskRepository = new TaskRepository();
