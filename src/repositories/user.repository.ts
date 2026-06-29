import { prisma } from "@/lib/prisma";
import { insertDoc, updateDocById, deleteDocById } from "@/lib/mongo-native";
import { UserFilters, PaginatedResult } from "@/types";
import { Role, User, UserStatus, Prisma } from "@prisma/client";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  managerId?: string;
  status?: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findByIdWithRelations(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        salesmen: { select: { id: true, name: true, email: true, status: true } },
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const doc = await insertDoc("User", {
      ...data,
      email: data.email.toLowerCase(),
      status: data.status || "ACTIVE",
    });
    return doc as unknown as User;
  }

  async update(id: string, data: Record<string, unknown>): Promise<User> {
    const doc = await updateDocById("User", id, data);
    return doc as unknown as User;
  }

  async delete(id: string): Promise<User> {
    const doc = await deleteDocById("User", id);
    return doc as unknown as User;
  }

  async findMany(filters: UserFilters): Promise<PaginatedResult<User>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;
    if (filters.managerId) where.managerId = filters.managerId;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          managerId: true,
          createdAt: true,
          updatedAt: true,
          password: false,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data as User[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countByRole(role: Role): Promise<number> {
    return prisma.user.count({ where: { role, status: "ACTIVE" } });
  }

  async getTeamMembers(managerId: string) {
    return prisma.user.findMany({
      where: { managerId, role: "SALESMAN" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getSalesmenIdsByManager(managerId: string): Promise<string[]> {
    const salesmen = await prisma.user.findMany({
      where: { managerId, role: "SALESMAN" },
      select: { id: true },
    });
    return salesmen.map((s) => s.id);
  }
}

export const userRepository = new UserRepository();
