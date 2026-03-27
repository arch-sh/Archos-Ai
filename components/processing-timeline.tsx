"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";

interface ProcessingTimelineProps {
  events: TimelineEvent[];
}

export function ProcessingTimeline({ events }: ProcessingTimelineProps) {
  return (
    <div className="flex flex-col gap-0">
      {events.map((event, i) => {
        const isLast = i === events.length - 1;
        return (
          <div key={event.stage} className="flex gap-3">
            {/* Line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                  event.status === "completed"
                    ? "border-success bg-success/10 text-success"
                    : event.status === "in_progress"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 bg-secondary text-muted-foreground"
                )}
              >
                {event.status === "completed" ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : event.status === "in_progress" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-6",
                    event.status === "completed"
                      ? "bg-success/30"
                      : "bg-muted-foreground/10"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-4", isLast && "pb-0")}>
              <p className="text-sm font-medium text-foreground">{event.stage}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground">{event.description}</p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground/70 font-mono">
                {new Date(event.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
