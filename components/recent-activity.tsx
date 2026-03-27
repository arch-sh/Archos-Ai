"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComplianceDocument } from "@/lib/types";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface RecentActivityProps {
  documents: ComplianceDocument[];
}

export function RecentActivity({ documents }: RecentActivityProps) {
  const sorted = [...documents]
    .sort(
      (a, b) =>
        new Date(b.timestamp || "").getTime() -
        new Date(a.timestamp || "").getTime()
    )
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity found. Documents will appear here once processed by
            the compliance engine.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {sorted.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  doc.risk_level === "HIGH"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"
                )}
              >
                {doc.risk_level === "HIGH" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {doc.document_id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {doc.document_type} - {doc.explanation.slice(0, 60)}...
                </p>
              </div>
              <Badge
                className={cn(
                  "shrink-0 text-xs",
                  doc.status === "COMPLIANT"
                    ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                    : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                )}
              >
                {doc.status === "COMPLIANT" ? "Compliant" : "Non-Compliant"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
