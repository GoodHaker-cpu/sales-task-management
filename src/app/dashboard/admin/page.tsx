import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/common/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { taskService } from "@/services/task.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const stats = await taskService.getDashboardStats(session.user);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Organization overview and performance metrics</p>
        </div>
        <StatsCards stats={stats} role="ADMIN" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {stats.totalTasks
                      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Manage users and organization hierarchy</p>
              <p>• View all tasks across teams</p>
              <p>• Generate organization performance reports</p>
              <p>• Monitor overdue tasks system-wide</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
