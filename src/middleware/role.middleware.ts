import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { decodeToken } from "@/lib/jwt";
import { Role } from "@prisma/client";
import { AppError, errorResponse } from "@/lib/api-response";
import { SessionUser } from "@/types";

export async function getAuthUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (session?.user) return session.user as SessionUser;

  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = decodeToken(authHeader.slice(7));
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
  }

  return null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getAuthUser();
  if (!user) throw new AppError("Unauthorized", 401);
  return user;
}

export function requireRoles(...roles: Role[]) {
  return async (): Promise<SessionUser> => {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
      throw new AppError("Forbidden - insufficient permissions", 403);
    }
    return user;
  };
}

export async function withAuth(
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth();
      return await handler(req, user);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function withRole(
  roles: Role[],
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const user = await requireRoles(...roles)();
      return await handler(req, user);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
