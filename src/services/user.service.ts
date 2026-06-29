import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { userRepository } from "@/repositories/user.repository";
import { activityRepository } from "@/repositories/notification.repository";
import { AppError } from "@/lib/api-response";
import { getCurrentISTDateTime } from "@/lib/utils";
import { CreateUserInput, UpdateUserInput, UpdateProfileInput, CreateAdminInput } from "@/validations/user.validation";
import { UserFilters, SessionUser } from "@/types";

export class UserService {
  async createUser(input: CreateUserInput, actor: SessionUser, ipAddress?: string) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new AppError("Email already exists", 409);

    if (input.role === "SALESMAN" && !input.managerId) {
      throw new AppError("Salesman must be assigned to a manager", 400);
    }

    if (input.role === "ADMIN" && actor.role !== "ADMIN") {
      throw new AppError("Only admin can create admin users", 403);
    }

    if (input.role === "MANAGER" && actor.role !== "ADMIN") {
      throw new AppError("Only admin can create managers", 403);
    }

    if (input.role === "SALESMAN") {
      if (actor.role === "MANAGER" && input.managerId !== actor.id) {
        throw new AppError("Managers can only create salesmen for their own team", 403);
      }
      if (actor.role === "ADMIN" && !input.managerId) {
        throw new AppError("Manager ID required for salesman", 400);
      }
    }

    const now = getCurrentISTDateTime();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      phone: input.phone,
      role: input.role as Role,
      managerId: input.managerId,
      createdAt: now,
      updatedAt: now,
    });

    await activityRepository.create({
      userId: actor.id,
      action: "USER_CREATED",
      details: `Created user ${user.email} with role ${user.role}`,
      ipAddress,
      createdAt: now,
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(id: string, input: UpdateUserInput, actor: SessionUser, ipAddress?: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError("User not found", 404);

    this.assertCanManageUser(actor, user);

    const now = getCurrentISTDateTime();
    const updated = await userRepository.update(id, { ...input, updatedAt: now });

    await activityRepository.create({
      userId: actor.id,
      action: "USER_UPDATED",
      details: `Updated user ${updated.email}`,
      ipAddress,
      createdAt: now,
    });

    const { password: _, ...safeUser } = updated;
    return safeUser;
  }

  async deactivateUser(id: string, actor: SessionUser, ipAddress?: string) {
    return this.updateUser(id, { status: "INACTIVE" }, actor, ipAddress);
  }

  async deleteUser(id: string, actor: SessionUser, ipAddress?: string) {
    if (actor.role !== "ADMIN") throw new AppError("Only admin can delete users", 403);

    const user = await userRepository.findById(id);
    if (!user) throw new AppError("User not found", 404);
    if (user.id === actor.id) throw new AppError("Cannot delete your own account", 400);

    await userRepository.delete(id);

    const now = getCurrentISTDateTime();
    await activityRepository.create({
      userId: actor.id,
      action: "USER_DELETED",
      details: `Deleted user ${user.email}`,
      ipAddress,
      createdAt: now,
    });

    return { message: "User deleted successfully" };
  }

  async getUsers(filters: UserFilters, actor: SessionUser) {
    if (actor.role === "MANAGER") {
      filters.managerId = actor.id;
      filters.role = "SALESMAN";
    } else if (actor.role === "SALESMAN") {
      throw new AppError("Salesmen cannot view user list", 403);
    }

    const result = await userRepository.findMany(filters);
    return {
      ...result,
      data: result.data.map(({ password: _, ...u }) => u),
    };
  }

  async getUserById(id: string, actor: SessionUser) {
    const user = await userRepository.findByIdWithRelations(id);
    if (!user) throw new AppError("User not found", 404);

    if (actor.role === "SALESMAN" && actor.id !== id) {
      throw new AppError("Access denied", 403);
    }

    if (actor.role === "MANAGER" && user.managerId !== actor.id && user.id !== actor.id) {
      throw new AppError("Access denied", 403);
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const now = getCurrentISTDateTime();
    const updated = await userRepository.update(userId, { ...input, updatedAt: now });
    const { password: _, ...safeUser } = updated;
    return safeUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    const now = getCurrentISTDateTime();
    await userRepository.update(userId, { password: hashed, updatedAt: now });

    return { message: "Password changed successfully" };
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: "If the email exists, a reset link will be sent" };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const now = getCurrentISTDateTime();
    const expiry = getCurrentISTDateTime(); // simplified - in production add 1 hour

    await userRepository.update(user.id, {
      resetToken: token,
      resetTokenExpiry: expiry,
      updatedAt: now,
    });

    // Email would be sent here via nodemailer
    return { message: "If the email exists, a reset link will be sent", token };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prismaFindByResetToken(token);
    if (!user) throw new AppError("Invalid or expired reset token", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    const now = getCurrentISTDateTime();

    await userRepository.update(user.id, {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: now,
    });

    return { message: "Password reset successfully" };
  }

  async createAdmin(input: CreateAdminInput, actor: SessionUser | null, ipAddress?: string) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new AppError("Email already exists", 409);

    const adminCount = await userRepository.countByRole("ADMIN");

    if (adminCount > 0) {
      if (!actor || actor.role !== "ADMIN") {
        throw new AppError("Only admin can create admin users", 403);
      }
    }

    const now = getCurrentISTDateTime();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      phone: input.phone,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    });

    await activityRepository.create({
      userId: actor?.id ?? user.id,
      action: "ADMIN_CREATED",
      details: adminCount === 0
        ? `Bootstrap admin created: ${user.email}`
        : `Admin ${actor!.email} created admin ${user.email}`,
      ipAddress,
      createdAt: now,
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  private assertCanManageUser(actor: SessionUser, target: { id: string; role: Role; managerId: string | null }) {
    if (actor.role === "ADMIN") return;
    if (actor.role === "MANAGER" && target.managerId === actor.id && target.role === "SALESMAN") return;
    if (actor.id === target.id) return;
    throw new AppError("Access denied", 403);
  }
}

async function prismaFindByResetToken(token: string) {
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.findFirst({ where: { resetToken: token } });
}

export const userService = new UserService();
