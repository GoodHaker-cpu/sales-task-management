"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/common/sidebar";
import { FormPageHeader } from "@/components/common/form-page-header";
import { FormActions } from "@/components/common/form-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaskSchema, CreateTaskInput } from "@/validations/task.validation";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/types";
import { getCurrentISTDateTime } from "@/lib/utils";
import Link from "next/link";

interface Salesman {
  id: string;
  name: string;
  email: string;
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
  assignedToId: string;
  startDateLocal: string;
  dueDateLocal: string;
  estimatedHours?: number;
  remarks?: string;
};

export default function CreateTaskPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const now = getCurrentISTDateTime();
  const defaultStart = istToDatetimeLocal(now);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      priority: "MEDIUM",
      startDateLocal: defaultStart,
      dueDateLocal: "",
    },
  });

  useEffect(() => {
    if (!session) return;

    if (session.user.role === "SALESMAN") {
      router.push("/tasks");
      return;
    }

    fetch("/api/users?role=SALESMAN&limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSalesmen(data.data.data);
      });
  }, [session, router]);

  const onSubmit = async (values: TaskFormValues) => {
    setLoading(true);
    setError("");

    const payload: CreateTaskInput = {
      title: values.title,
      description: values.description,
      priority: values.priority,
      category: values.category,
      assignedToId: values.assignedToId,
      startDate: datetimeLocalToIST(values.startDateLocal),
      dueDate: datetimeLocalToIST(values.dueDateLocal),
      estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
      remarks: values.remarks,
    };

    try {
      createTaskSchema.parse(payload);

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to create task");
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

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <FormPageHeader
          backHref="/tasks"
          title="Create Task"
          description="Assign a new task to a salesman (IST dates)"
        />

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Dates are stored in YYYY:MM:DD:HH:MM:SS IST format</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="Follow up with client" {...register("title", { required: true, minLength: 3 })} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message || "Title is required"}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Task description..."
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    {...register("priority")}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="Sales, Reporting..." {...register("category")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedToId">Assign To *</Label>
                <select
                  id="assignedToId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register("assignedToId", { required: true })}
                >
                  <option value="">Select salesman</option>
                  {salesmen.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                {errors.assignedToId && <p className="text-sm text-red-500">Assignee is required</p>}
                {salesmen.length === 0 && (
                  <p className="text-sm text-muted-foreground">No salesmen found. Create a salesman first.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateLocal">Start Date & Time (IST) *</Label>
                  <Input id="startDateLocal" type="datetime-local" {...register("startDateLocal", { required: true })} />
                  {errors.startDateLocal && <p className="text-sm text-red-500">Start date is required</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDateLocal">Due Date & Time (IST) *</Label>
                  <Input id="dueDateLocal" type="datetime-local" {...register("dueDateLocal", { required: true })} />
                  {errors.dueDateLocal && <p className="text-sm text-red-500">Due date is required</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="8"
                  {...register("estimatedHours", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" placeholder="Optional notes" {...register("remarks")} />
              </div>

              <FormActions>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Creating..." : "Create Task"}
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
