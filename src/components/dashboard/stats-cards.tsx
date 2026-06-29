"use client";

import { DashboardStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
  role: "ADMIN" | "MANAGER" | "SALESMAN";
}

const iconMap = {
  managers: Users,
  salesmen: UserCheck,
  team: Users,
  tasks: ClipboardList,
  completed: CheckCircle2,
  pending: Clock,
  overdue: AlertTriangle,
  assigned: ClipboardList,
};

export function StatsCards({ stats, role }: StatsCardsProps) {
  const cards =
    role === "ADMIN"
      ? [
          { title: "Total Managers", value: stats.totalManagers ?? 0, key: "managers", color: "text-blue-600" },
          { title: "Total Salesmen", value: stats.totalSalesmen ?? 0, key: "salesmen", color: "text-indigo-600" },
          { title: "Total Tasks", value: stats.totalTasks, key: "tasks", color: "text-purple-600" },
          { title: "Completed", value: stats.completedTasks, key: "completed", color: "text-green-600" },
          { title: "Pending", value: stats.pendingTasks, key: "pending", color: "text-yellow-600" },
          { title: "Overdue", value: stats.overdueTasks, key: "overdue", color: "text-red-600" },
        ]
      : role === "MANAGER"
        ? [
            { title: "Team Members", value: stats.totalTeamMembers ?? 0, key: "team", color: "text-blue-600" },
            { title: "Assigned Tasks", value: stats.assignedTasks ?? 0, key: "assigned", color: "text-purple-600" },
            { title: "Completed", value: stats.completedTasks, key: "completed", color: "text-green-600" },
            { title: "Pending", value: stats.pendingTasks, key: "pending", color: "text-yellow-600" },
            { title: "Overdue", value: stats.overdueTasks, key: "overdue", color: "text-red-600" },
          ]
        : [
            { title: "Assigned Tasks", value: stats.assignedTasks ?? 0, key: "assigned", color: "text-purple-600" },
            { title: "Completed", value: stats.completedTasks, key: "completed", color: "text-green-600" },
            { title: "Pending", value: stats.pendingTasks, key: "pending", color: "text-yellow-600" },
            { title: "Overdue", value: stats.overdueTasks, key: "overdue", color: "text-red-600" },
          ];

  return (
    <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = iconMap[card.key as keyof typeof iconMap] || ClipboardList;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
