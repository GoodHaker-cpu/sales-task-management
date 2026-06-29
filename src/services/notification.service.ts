import { notificationRepository } from "@/repositories/notification.repository";
import { getCurrentISTDateTime } from "@/lib/utils";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  async notifyTaskAssigned(taskId: string, userId: string, taskTitle: string) {
    const now = getCurrentISTDateTime();
    return notificationRepository.create({
      userId,
      message: `New task assigned: "${taskTitle}"`,
      type: "TASK_ASSIGNED" as NotificationType,
      createdAt: now,
    });
  }

  async notifyTaskCompleted(taskId: string, userId: string, taskTitle: string) {
    const now = getCurrentISTDateTime();
    return notificationRepository.create({
      userId,
      message: `Task completed: "${taskTitle}"`,
      type: "TASK_COMPLETED" as NotificationType,
      createdAt: now,
    });
  }

  async notifyTaskOverdue(userId: string, taskTitle: string) {
    const now = getCurrentISTDateTime();
    return notificationRepository.create({
      userId,
      message: `Task overdue: "${taskTitle}" - Task Not Completed Within Timeline`,
      type: "TASK_OVERDUE" as NotificationType,
      createdAt: now,
    });
  }

  async notifyTaskDueTomorrow(userId: string, taskTitle: string) {
    const now = getCurrentISTDateTime();
    return notificationRepository.create({
      userId,
      message: `Task due tomorrow: "${taskTitle}"`,
      type: "TASK_DUE_TOMORROW" as NotificationType,
      createdAt: now,
    });
  }

  async getNotifications(userId: string, unreadOnly = false) {
    return notificationRepository.findByUser(userId, unreadOnly);
  }

  async markAsRead(id: string) {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string) {
    return notificationRepository.countUnread(userId);
  }
}

export const notificationService = new NotificationService();
