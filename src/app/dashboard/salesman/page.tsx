import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/common/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { taskService } from "@/services/task.service";
import { taskRepository } from "@/repositories/task.repository";
import { getCurrentISTDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";

export default async function SalesmanDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SALESMAN") redirect("/login");

  const stats = await taskService.getDashboardStats(session.user);
  const allTasks = await taskRepository.getTasksByAssignee(session.user.id);
  const today = getCurrentISTDateTime().slice(0, 10);

  const todaysTasks = allTasks.filter((t) => t.dueDate.startsWith(today));
  const upcomingTasks = allTasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && !t.dueDate.startsWith(today)
  ).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your assigned tasks and schedule</p>
        </div>
        <StatsCards stats={stats} role="SALESMAN" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {todaysTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks due today</p>
              ) : (
                <div className="space-y-3">
                  {todaysTasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.taskId}</p>
                      </div>
                      <Badge variant={task.isOverdue ? "danger" : "secondary"}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming tasks</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                      </div>
                      <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
