import { Role, TaskPriority, TaskStatus, UserStatus } from "@prisma/client";

export type { Role, TaskPriority, TaskStatus, UserStatus };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface DashboardStats {
  totalManagers?: number;
  totalSalesmen?: number;
  totalTeamMembers?: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  assignedTasks?: number;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  assignedToId?: string;
  assignedById?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserFilters {
  search?: string;
  role?: Role;
  status?: UserStatus;
  managerId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  rows: Record<string, string | number>[];
  summary?: Record<string, number>;
}

export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const TASK_STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
  "CANCELLED",
];
export const ROLES: Role[] = ["ADMIN", "MANAGER", "SALESMAN"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALESMAN: "Salesman",
};
