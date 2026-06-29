import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { getAuthUser } from "@/middleware/role.middleware";
import { createAdminSchema } from "@/validations/user.validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createAdminSchema.parse(body);
    const actor = await getAuthUser();

    const admin = await userService.createAdmin(validated, actor, getClientIp(req));
    return successResponse(admin, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
