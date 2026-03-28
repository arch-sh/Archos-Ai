"use client";

import React, { useState } from "react"

import { useAuth } from "@/components/auth-provider";
import { AppSidebar, MobileSidebar, MobileMenuButton } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar />
      
      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6 bg-background/80 backdrop-blur-sm">
          {/* Mobile: Menu button + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold">ArkhosAI</span>
            </div>
          </div>
          
          {/* Desktop: Empty space */}
          <div className="hidden md:block" />
          
          {/* Theme toggle */}
          <ThemeToggle />
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
