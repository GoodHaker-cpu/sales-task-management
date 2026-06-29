"use client";

import { DashboardLayout } from "@/components/common/sidebar";

export function AuthLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    </DashboardLayout>
  );
}
