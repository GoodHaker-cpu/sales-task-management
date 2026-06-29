import { NextRequest } from "next/server";
import { notificationService } from "@/services/notification.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await notificationService.getNotifications(user.id, unreadOnly);
    const unreadCount = await notificationService.getUnreadCount(user.id);

    return successResponse({ notifications, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    if (body.markAll) {
      await notificationService.markAllAsRead(user.id);
      return successResponse({ message: "All notifications marked as read" });
    }

    if (body.id) {
      await notificationService.markAsRead(body.id);
      return successResponse({ message: "Notification marked as read" });
    }

    return errorResponse(new Error("Invalid request"), "Invalid request");
  } catch (error) {
    return errorResponse(error);
  }
}
