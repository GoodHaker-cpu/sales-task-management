import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/dashboard/manager") && token?.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/dashboard/salesman") && token?.role !== "SALESMAN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/users") && token?.role === "SALESMAN") {
      return NextResponse.redirect(new URL("/dashboard/salesman", req.url));
    }
    if (path.startsWith("/tasks/create") && token?.role === "SALESMAN") {
      return NextResponse.redirect(new URL("/tasks", req.url));
    }
    if (path.match(/^\/tasks\/[^/]+\/edit/) && token?.role === "SALESMAN") {
      return NextResponse.redirect(new URL("/tasks", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/login", "/forgot-password", "/reset-password"];
        if (publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/users/:path*",
    "/reports/:path*",
  ],
};
