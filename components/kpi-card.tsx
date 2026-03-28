"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = "text-primary",
}: KPICardProps) {
  return (
    <Card className="glass-card group transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-3 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
            <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-secondary/80 transition-colors group-hover:bg-primary/10 shrink-0",
              accentColor
            )}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
