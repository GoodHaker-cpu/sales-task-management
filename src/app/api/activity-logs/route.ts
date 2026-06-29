import { NextRequest } from "next/server";
import { activityRepository } from "@/repositories/notification.repository";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const filters = {
      userId: user.role === "ADMIN" ? searchParams.get("userId") || undefined : user.id,
      action: searchParams.get("action") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await activityRepository.findMany(filters);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
