import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/utils";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  redirect("/login");
}
