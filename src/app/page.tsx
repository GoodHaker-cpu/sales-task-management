import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/utils";

export default async function HomePage() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role) {
      redirect(getRoleDashboardPath(session.user.role));
    }
  } catch {
    // NextAuth misconfigured on server (e.g. missing NEXTAUTH_SECRET on Vercel)
  }

  redirect("/login");
}
