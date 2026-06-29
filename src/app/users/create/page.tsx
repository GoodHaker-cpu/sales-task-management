"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { DashboardLayout } from "@/components/common/sidebar";
import { FormPageHeader } from "@/components/common/form-page-header";
import { FormActions } from "@/components/common/form-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserSchema, CreateUserInput } from "@/validations/user.validation";
import { ROLE_LABELS } from "@/types";
import { Role } from "@prisma/client";

interface Manager {
  id: string;
  name: string;
  email: string;
}

type UserFormValues = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  managerId?: string;
};

export default function CreateUserPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = session?.user.role === "ADMIN";
  const isManager = session?.user.role === "MANAGER";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      role: "SALESMAN",
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (!session || !isAdmin) return;
    fetch("/api/users?role=MANAGER&limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setManagers(data.data.data);
      });
  }, [session, isAdmin]);

  const onSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    setError("");

    const payload: CreateUserInput = {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone || undefined,
      role: isManager ? "SALESMAN" : values.role,
      managerId: isManager
        ? session!.user.id
        : values.role === "SALESMAN"
          ? values.managerId
          : undefined,
    };

    try {
      createUserSchema.parse(payload);

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to create user");
        setSubmitting(false);
        return;
      }

      router.push("/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setSubmitting(false);
    }
  };

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated || !session || session.user.role === "SALESMAN") return null;

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <FormPageHeader
          backHref="/users"
          title="Add User"
          description={
            isManager ? "Create a new salesman for your team" : "Create a new user account"
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              {isManager
                ? "The salesman will be assigned to your team automatically."
                : "Select role and fill in account details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="John Doe" {...register("name", { required: true, minLength: 2 })} />
                {errors.name && <p className="text-sm text-red-500">Name must be at least 2 characters</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="user@example.com" {...register("email", { required: true })} />
                {errors.email && <p className="text-sm text-red-500">Valid email is required</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...register("password", { required: true, minLength: 6 })}
                />
                {errors.password && <p className="text-sm text-red-500">Password must be at least 6 characters</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+91 9876543210" {...register("phone")} />
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    {...register("role", { required: true })}
                  >
                    <option value="SALESMAN">{ROLE_LABELS.SALESMAN}</option>
                    <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
                    <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                  </select>
                </div>
              )}

              {isAdmin && selectedRole === "SALESMAN" && (
                <div className="space-y-2">
                  <Label htmlFor="managerId">Assign to Manager *</Label>
                  <select
                    id="managerId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    {...register("managerId", { required: selectedRole === "SALESMAN" })}
                  >
                    <option value="">Select manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                  {errors.managerId && <p className="text-sm text-red-500">Manager is required for salesmen</p>}
                  {managers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No managers found. Create a manager first.</p>
                  )}
                </div>
              )}

              <FormActions>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Creating..." : "Create User"}
                </Button>
                <Link href="/users" className="w-full sm:w-auto">
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
