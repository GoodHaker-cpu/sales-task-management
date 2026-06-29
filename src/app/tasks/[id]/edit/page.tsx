"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/common/sidebar";
import { FormPageHeader } from "@/components/common/form-page-header";
import { FormActions } from "@/components/common/form-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTaskSchema, UpdateTaskInput } from "@/validations/task.validation";
import { PRIORITY_LABELS, TASK_PRIORITIES, STATUS_LABELS, TASK_STATUSES } from "@/types";
import Link from "next/link";

interface Salesman {
  id: string;
  name: string;
  email: string;
}

interface TaskDetail {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  priority: keyof typeof PRIORITY_LABELS;
  category?: string;
  status: keyof typeof STATUS_LABELS;
  assignedToId: string;
  assignedById: string;
  startDate: string;
  dueDate: string;
  estimatedHours?: number;
  remarks?: string;
}

function datetimeLocalToIST(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = (timePart || "00:00").split(":");
  return `${year}:${month}:${day}:${hour}:${minute}:00`;
}

function istToDatetimeLocal(ist: string): string {
  const parts = ist.split(":");
  if (parts.length < 5) return "";
  return `${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}`;
}

type TaskFormValues = {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  assignedToId: string;
  startDateLocal: string;
  dueDateLocal: string;
  estimatedHours?: number;
  remarks?: string;
};

export default function EditTaskPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>();

  useEffect(() => {
    if (!session) return;

    if (session.user.role === "SALESMAN") {
      router.push("/tasks");
      return;
    }

    Promise.all([
      fetch(`/api/tasks/${taskId}`).then((r) => r.json()),
      fetch("/api/users?role=SALESMAN&limit=100").then((r) => r.json()),
    ]).then(([taskRes, usersRes]) => {
      if (!taskRes.success) {
        setError(taskRes.error || "Task not found");
        setFetching(false);
        return;
      }

      const t: TaskDetail = taskRes.data;
      setTask(t);

      if (usersRes.success) setSalesmen(usersRes.data.data);

      reset({
        title: t.title,
        description: t.description || "",
        priority: t.priority,
        category: t.category || "",
        status: t.status,
        assignedToId: t.assignedToId,
        startDateLocal: istToDatetimeLocal(t.startDate),
        dueDateLocal: istToDatetimeLocal(t.dueDate),
        estimatedHours: t.estimatedHours,
        remarks: t.remarks || "",
      });

      setFetching(false);
    });
  }, [session, taskId, router, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    setLoading(true);
    setError("");

    const payload: UpdateTaskInput = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      category: values.category,
      status: values.status,
      assignedToId: values.assignedToId,
      startDate: datetimeLocalToIST(values.startDateLocal),
      dueDate: datetimeLocalToIST(values.dueDateLocal),
      estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
      remarks: values.remarks,
    };

    try {
      updateTaskSchema.parse(payload);

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to update task");
        setLoading(false);
        return;
      }

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setLoading(false);
    }
  };

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated || !session || session.user.role === "SALESMAN") return null;

  if (fetching) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground p-6">Loading task...</p>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <p className="text-red-500">{error || "Task not found"}</p>
          <Link href="/tasks"><Button variant="outline">Back to Tasks</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <FormPageHeader backHref="/tasks" title="Edit Task" description={task.taskId} />

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Update task information (IST dates)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register("title", { required: true, minLength: 3 })} />
                {errors.title && <p className="text-sm text-red-500">Title is required</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select id="priority" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register("priority")}>
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register("status")}>
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register("category")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedToId">Assign To *</Label>
                <select id="assignedToId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register("assignedToId", { required: true })}>
                  {salesmen.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateLocal">Start Date & Time (IST) *</Label>
                  <Input id="startDateLocal" type="datetime-local" {...register("startDateLocal", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDateLocal">Due Date & Time (IST) *</Label>
                  <Input id="dueDateLocal" type="datetime-local" {...register("dueDateLocal", { required: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input id="estimatedHours" type="number" step="0.5" min="0" {...register("estimatedHours", { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" {...register("remarks")} />
              </div>

              <FormActions>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Link href="/tasks" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full">Cancel</Button>
                </Link>
              </FormActions>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
