import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { updateUserSchema, updateProfileSchema } from "@/validations/user.validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await userService.getUserById(id, user);
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

    if (user.id === id && user.role === "SALESMAN") {
      const validated = updateProfileSchema.parse(body);
      const result = await userService.updateProfile(id, validated);
      return successResponse(result);
    }

    const validated = updateUserSchema.parse(body);
    const result = await userService.updateUser(id, validated, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await userService.deleteUser(id, user, getClientIp(req));
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
