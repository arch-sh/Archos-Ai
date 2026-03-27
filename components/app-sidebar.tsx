"use client";

import React from "react"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { hasMinimumRole } from "@/lib/auth";
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredRole: "Reviewer",
  },
  {
    label: "Upload",
    href: "/upload",
    icon: Upload,
    requiredRole: "Analyst",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    requiredRole: "Reviewer",
  },
  {
    label: "Review Queue",
    href: "/review",
    icon: Shield,
    requiredRole: "Reviewer",
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    requiredRole: "Analyst",
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    requiredRole: "Admin",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    requiredRole: "Admin",
  },
];





export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems =
    user
      ? NAV_ITEMS.filter((item) =>
          hasMinimumRole(user.role, item.requiredRole)
        )
      : [];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                ArkhosAI
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="bg-popover text-popover-foreground">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          {/* User info */}
          {!collapsed && (
            <div className="mb-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.username ?? ""}
              </p>
              <p className="text-xs text-muted-foreground">{user?.role ?? ""}</p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="flex-1 justify-start gap-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-xs">Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-popover text-popover-foreground">
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </span>
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
