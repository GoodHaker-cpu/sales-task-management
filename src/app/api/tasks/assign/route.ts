import { NextRequest } from "next/server";
import { taskService } from "@/services/task.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { assignTaskSchema, completeTaskSchema, bulkAssignSchema } from "@/validations/task.validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = assignTaskSchema.parse(body);
    const result = await taskService.assignTask(
      validated.taskId,
      validated.assignedToId,
      user,
      getClientIp(req)
    );
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = bulkAssignSchema.parse(body);
    const result = await taskService.bulkAssign(validated, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
