"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ROLE_LABELS } from "@/types";

const navItems = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Users", icon: Users },
    { href: "/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/reports", label: "Reports", icon: FileText },
  ],
  MANAGER: [
    { href: "/dashboard/manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Team", icon: Users },
    { href: "/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/reports", label: "Reports", icon: FileText },
  ],
  SALESMAN: [
    { href: "/dashboard/salesman", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "My Tasks", icon: ClipboardList },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role || "SALESMAN";
  const items = navItems[role];

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-card/95 backdrop-blur border-b flex items-center pl-14 pr-4">
        <span className="font-semibold text-sm truncate">Sales Task MS</span>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        type="button"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-card border shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[min(100vw-3rem,16rem)] sm:w-64 bg-card border-r transform transition-transform md:translate-x-0 shadow-xl md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-lg font-bold text-primary">Sales Task MS</h1>
            <p className="text-xs text-muted-foreground mt-1">IST (Asia/Kolkata)</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-3">
            <div className="px-3">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="px-4 py-4 pt-[4.25rem] md:px-6 md:py-6 md:pt-6 max-w-full">{children}</div>
      </main>
    </div>
  );
}
