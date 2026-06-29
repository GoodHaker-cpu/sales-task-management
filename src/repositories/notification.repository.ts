import { prisma } from "@/lib/prisma";
import { insertDoc, updateDocById, updateManyDocs } from "@/lib/mongo-native";
import { NotificationType, Prisma } from "@prisma/client";

export class NotificationRepository {
  async create(data: {
    userId: string;
    message: string;
    type: NotificationType;
    createdAt: string;
  }) {
    const doc = await insertDoc("Notification", { ...data, isRead: false });
    return doc;
  }

  async findByUser(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    const doc = await updateDocById("Notification", id, { isRead: true });
    return doc;
  }

  async markAllAsRead(userId: string) {
    return updateManyDocs("Notification", { userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export const notificationRepository = new NotificationRepository();

export class ActivityRepository {
  async create(data: {
    userId: string;
    action: string;
    details?: string;
    ipAddress?: string;
    createdAt: string;
  }) {
    const doc = await insertDoc("ActivityLog", data);
    return doc;
  }

  async findMany(filters: {
    userId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const activityRepository = new ActivityRepository();
