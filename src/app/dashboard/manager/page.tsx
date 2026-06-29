import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/common/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { taskService } from "@/services/task.service";
import { userRepository } from "@/repositories/user.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "MANAGER") redirect("/login");

  const stats = await taskService.getDashboardStats(session.user);
  const team = await userRepository.getTeamMembers(session.user.id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your team and track task progress</p>
        </div>
        <StatsCards stats={stats} role="MANAGER" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Salesman Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet. Create salesmen to get started.</p>
              ) : (
                <div className="space-y-3">
                  {team.map((member) => (
                    <div key={member.id} className="flex justify-between items-center text-sm">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground">{member.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.assignedTasks
                  ? Math.round((stats.completedTasks / stats.assignedTasks) * 100)
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.completedTasks} of {stats.assignedTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
