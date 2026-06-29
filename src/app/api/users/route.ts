import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-response";
import { requireAuth, withRole } from "@/middleware/role.middleware";
import { createUserSchema, updateUserSchema } from "@/validations/user.validation";
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "@/validations/auth.validation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      role: (searchParams.get("role") as "ADMIN" | "MANAGER" | "SALESMAN") || undefined,
      status: (searchParams.get("status") as "ACTIVE" | "INACTIVE") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await userService.getUsers(filters, user);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = createUserSchema.parse(body);
    const result = await userService.createUser(validated, user, getClientIp(req));
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
