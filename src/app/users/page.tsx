"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/common/sidebar";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: keyof typeof ROLE_LABELS;
  status: string;
  phone?: string;
}

export default function UsersPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (session.user.role === "SALESMAN") {
      router.push("/dashboard/salesman");
      return;
    }
    fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.success) setUsers(data.data.data);
    setLoading(false);
  };

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated || !session || session.user.role === "SALESMAN") return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description={session.user.role === "ADMIN" ? "Manage all users" : "Manage your team"}
          action={<Button onClick={() => router.push("/users/create")}>Add User</Button>}
        />

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground">No users found</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {users.map((user) => (
                    <div key={user.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                        </div>
                        <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                        {user.phone && <span className="text-muted-foreground">{user.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3">{user.name}</td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3">{user.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
