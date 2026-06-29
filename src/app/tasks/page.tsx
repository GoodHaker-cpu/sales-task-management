"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { DashboardLayout } from "@/components/common/sidebar";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import { getTaskTimelineMetric } from "@/lib/utils";
import { Search, AlertTriangle, Pencil, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  taskId: string;
  title: string;
  status: keyof typeof STATUS_LABELS;
  priority: keyof typeof PRIORITY_LABELS;
  dueDate: string;
  completionDate?: string | null;
  isOverdue: boolean;
  assignedById: string;
  assignedToId: string;
  assignedTo?: { name: string };
  assignedBy?: { name: string };
}

function canEditTask(task: Task, role: string, userId: string): boolean {
  if (role === "ADMIN") return true;
  if (role === "MANAGER" && task.assignedById === userId) return true;
  return false;
}

function canSalesmanAct(task: Task, userId: string): boolean {
  return task.assignedToId === userId && task.status !== "COMPLETED" && task.status !== "CANCELLED";
}

export default function TasksPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!session) return;
    fetchTasks();
  }, [session, search, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    if (data.success) setTasks(data.data.data);
    setLoading(false);
  };

  const handleStartTask = async (taskId: string) => {
    setActionLoading(taskId);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    const data = await res.json();
    setActionLoading(null);
    if (data.success) fetchTasks();
    else alert(data.error || "Failed to update task");
  };

  const handleCompleteTask = async (taskId: string) => {
    setActionLoading(taskId);
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, remarks: remarks || undefined }),
    });
    const data = await res.json();
    setActionLoading(null);
    setCompleteTaskId(null);
    setRemarks("");
    if (data.success) fetchTasks();
    else alert(data.error || "Failed to complete task");
  };

  const getStatusVariant = (status: string, isOverdue: boolean) => {
    if (status === "COMPLETED") return "success";
    if (isOverdue || status === "OVERDUE") return "danger";
    switch (status) {
      case "IN_PROGRESS": return "default";
      case "CANCELLED": return "secondary";
      default: return "warning";
    }
  };

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated || !session) return null;

  const isSalesman = session.user.role === "SALESMAN";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={isSalesman ? "My Tasks" : "Tasks"}
          description={
            isSalesman
              ? "Update status and mark tasks as completed"
              : "Manage and track all tasks"
          }
          action={
            !isSalesman ? (
              <Button asChild>
                <Link href="/tasks/create">Create Task</Link>
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or task ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-muted-foreground">No tasks found</p>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="space-y-3 md:hidden">
                  {tasks.map((task) => {
                    const timeline = getTaskTimelineMetric(task.dueDate, task.status, task.completionDate);
                    const showSalesmanActions = isSalesman && canSalesmanAct(task, session.user.id);
                    const showEdit = canEditTask(task, session.user.role, session.user.id);

                    return (
                      <div key={task.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm leading-snug">{task.title}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{task.taskId}</p>
                          </div>
                          {task.isOverdue && task.status !== "COMPLETED" && (
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
                          <Badge variant={getStatusVariant(task.status, task.isOverdue)}>
                            {task.status === "COMPLETED" && task.isOverdue
                              ? "Completed (Late)"
                              : STATUS_LABELS[task.status]}
                          </Badge>
                          <Badge variant={timeline.variant}>{timeline.label}</Badge>
                        </div>
                        <dl className="grid grid-cols-1 gap-1.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Due (IST)</dt>
                            <dd className="font-mono text-right break-all">{task.dueDate}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Completed (IST)</dt>
                            <dd className="font-mono text-right break-all">{task.completionDate || "—"}</dd>
                          </div>
                          {!isSalesman && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-muted-foreground">Assignee</dt>
                              <dd className="text-right">{task.assignedTo?.name || "—"}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {showSalesmanActions && (
                            <>
                              {(task.status === "PENDING" || task.status === "OVERDUE") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 flex-1 sm:flex-none"
                                  disabled={actionLoading === task.id}
                                  onClick={() => handleStartTask(task.id)}
                                >
                                  <Play className="h-3 w-3" />
                                  Start
                                </Button>
                              )}
                              <Button
                                variant="default"
                                size="sm"
                                className="gap-1 flex-1 sm:flex-none"
                                disabled={actionLoading === task.id}
                                onClick={() => setCompleteTaskId(task.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Complete
                              </Button>
                            </>
                          )}
                          {showEdit && (
                            <Link href={`/tasks/${task.id}/edit`} className="flex-1 sm:flex-none">
                              <Button variant="outline" size="sm" className="gap-1 w-full">
                                <Pencil className="h-3 w-3" />
                                Edit
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-3 font-medium">Task ID</th>
                      <th className="pb-3 pr-3 font-medium">Title</th>
                      <th className="pb-3 pr-3 font-medium">Priority</th>
                      <th className="pb-3 pr-3 font-medium">Status</th>
                      <th className="pb-3 pr-3 font-medium">Due Date (IST)</th>
                      <th className="pb-3 pr-3 font-medium">Completed (IST)</th>
                      <th className="pb-3 pr-3 font-medium">Timeline</th>
                      {!isSalesman && <th className="pb-3 pr-3 font-medium">Assignee</th>}
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const timeline = getTaskTimelineMetric(task.dueDate, task.status, task.completionDate);
                      const showSalesmanActions = isSalesman && canSalesmanAct(task, session.user.id);
                      const showEdit = canEditTask(task, session.user.role, session.user.id);

                      return (
                        <tr key={task.id} className="border-b last:border-0">
                          <td className="py-3 pr-3 font-mono text-xs">{task.taskId}</td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              {task.title}
                              {task.isOverdue && task.status !== "COMPLETED" && (
                                <span title="Task Not Completed Within Timeline">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant={getStatusVariant(task.status, task.isOverdue)}>
                              {task.status === "COMPLETED" && task.isOverdue
                                ? "Completed (Late)"
                                : STATUS_LABELS[task.status]}
                            </Badge>
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap">{task.dueDate}</td>
                          <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap">
                            {task.completionDate || "—"}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant={timeline.variant}>{timeline.label}</Badge>
                          </td>
                          {!isSalesman && (
                            <td className="py-3 pr-3">{task.assignedTo?.name}</td>
                          )}
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              {showSalesmanActions && (
                                <>
                                  {task.status === "PENDING" || task.status === "OVERDUE" ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      disabled={actionLoading === task.id}
                                      onClick={() => handleStartTask(task.id)}
                                    >
                                      <Play className="h-3 w-3" />
                                      Start
                                    </Button>
                                  ) : null}
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-1"
                                    disabled={actionLoading === task.id}
                                    onClick={() => setCompleteTaskId(task.id)}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Complete
                                  </Button>
                                </>
                              )}
                              {showEdit && (
                                <Link href={`/tasks/${task.id}/edit`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </Button>
                                </Link>
                              )}
                              {!showSalesmanActions && !showEdit && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {completeTaskId && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <Card className="w-full sm:max-w-md rounded-b-none sm:rounded-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Mark Task as Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Completion time will be recorded in IST automatically.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (optional)</Label>
                  <Input
                    id="remarks"
                    placeholder="Completion notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    onClick={() => handleCompleteTask(completeTaskId)}
                    disabled={actionLoading === completeTaskId}
                  >
                    {actionLoading === completeTaskId ? "Saving..." : "Confirm Complete"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCompleteTaskId(null);
                      setRemarks("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
