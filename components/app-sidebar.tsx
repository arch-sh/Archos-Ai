"use client";

import React from "react"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { hasMinimumRole } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Menu,
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

// Shared navigation content for both desktop and mobile
function SidebarNav({ 
  collapsed = false, 
  onNavigate 
}: { 
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const visibleItems =
    user
      ? NAV_ITEMS.filter((item) =>
          hasMinimumRole(user.role, item.requiredRole)
        )
      : [];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden" onClick={onNavigate}>
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
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  onNavigate?.();
                }}
                className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
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
        </div>
      </div>
    </TooltipProvider>
  );
}

// Mobile hamburger button - exposed for layout to use
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden h-9 w-9"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

// Mobile sheet sidebar
export function MobileSidebar({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarNav onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar
export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Don't render desktop sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <SidebarNav collapsed={collapsed} />
      
      {/* Collapse toggle */}
      <div className="absolute bottom-4 right-0 translate-x-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-6 w-6 rounded-full border-border bg-background shadow-md"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>
      </div>
    </aside>
  );
}
