import { NextRequest } from "next/server";
import { taskService } from "@/services/task.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { completeTaskSchema } from "@/validations/task.validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = completeTaskSchema.parse(body);
    const result = await taskService.completeTask(validated, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
