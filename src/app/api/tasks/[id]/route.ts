import { NextRequest } from "next/server";
import { taskService } from "@/services/task.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { updateTaskSchema } from "@/validations/task.validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await taskService.getTaskById(id, user);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const validated = updateTaskSchema.parse(body);
    const result = await taskService.updateTask(id, validated, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await taskService.deleteTask(id, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
