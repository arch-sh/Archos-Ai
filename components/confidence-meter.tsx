"use client";

import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number;
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percent = Math.round(confidence * 100);
  const color =
    confidence >= 0.9
      ? "text-success"
      : confidence >= 0.7
        ? "text-warning"
        : "text-destructive";

  const barColor =
    confidence >= 0.9
      ? "bg-success"
      : confidence >= 0.7
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Confidence Score
        </span>
        <span className={cn("text-2xl font-bold font-mono", color)}>
          {percent}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {confidence >= 0.9
          ? "High confidence - AI is very certain about this assessment"
          : confidence >= 0.7
            ? "Moderate confidence - Review recommended"
            : "Low confidence - Manual review required"}
      </p>
    </div>
  );
}
