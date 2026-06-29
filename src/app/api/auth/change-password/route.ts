import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";
import { changePasswordSchema } from "@/validations/auth.validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = changePasswordSchema.parse(body);
    const result = await userService.changePassword(
      user.id,
      validated.currentPassword,
      validated.newPassword
    );
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
