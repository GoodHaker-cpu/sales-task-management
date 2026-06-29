import { NextRequest } from "next/server";
import { taskService } from "@/services/task.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { createTaskSchema } from "@/validations/task.validation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED") || undefined,
      priority: (searchParams.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || undefined,
      category: searchParams.get("category") || undefined,
      assignedToId: searchParams.get("assignedToId") || undefined,
      assignedById: searchParams.get("assignedById") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    const result = await taskService.getTasks(filters, user);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createTaskSchema.parse(body);
    const result = await taskService.createTask(validated, user, getClientIp(req));
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
