"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ScrollText, Clock, User, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditLogEntry } from "@/lib/types";
import { safeGetAuditLogs } from "@/lib/api";
import { Button } from "@/components/ui/button";

const EVENT_TYPE_COLORS: Record<string, string> = {
  DOCUMENT_UPLOADED: "bg-blue-100 text-blue-700 border border-blue-200",
  OCR_COMPLETED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  ANALYSIS_COMPLETED: "bg-purple-100 text-purple-700 border border-purple-200",

  REVIEW_PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  COMPLIANCE_REVIEW_DECISION: "bg-amber-100 text-amber-800 border border-amber-300",

  COMPLIANCE_STORED: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  COMPLIANCE_REPORT_GENERATED: "bg-teal-100 text-teal-700 border border-teal-200",

  OCR_FAILED: "bg-red-100 text-red-700 border border-red-300",
  ANALYSIS_FAILED: "bg-red-100 text-red-700 border border-red-300",
};

// Mobile card view for audit log entry
function MobileAuditLogCard({ log }: { log: AuditLogEntry }) {
  const ts = new Date(log.timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - ts.getTime()) / 1000);

  let relative = `${diff}s ago`;
  if (diff > 60) relative = `${Math.floor(diff / 60)}m ago`;
  if (diff > 3600) relative = `${Math.floor(diff / 3600)}h ago`;
  if (diff > 86400) relative = `${Math.floor(diff / 86400)}d ago`;

  return (
    <div className="p-4 border border-border rounded-xl bg-card space-y-3">
      {/* Event type badge */}
      <div className="flex items-start justify-between gap-2">
        <Badge
          className={cn(
            "text-[10px] font-medium tracking-wide px-2 py-1",
            EVENT_TYPE_COLORS[log.event_type] || "bg-secondary text-secondary-foreground"
          )}
        >
          {(log.event_type ?? "UNKNOWN").replace(/_/g, " ")}
        </Badge>
        <span className="text-xs text-muted-foreground">{relative}</span>
      </div>
      
      {/* User and reference */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{log.user ?? "SYSTEM"}</span>
          {log.user_role && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
              {log.user_role}
            </Badge>
          )}
        </div>
        {log.document_id && (
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-primary truncate max-w-[120px]">
              {log.document_id}
            </span>
          </div>
        )}
      </div>
      
      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          {ts.toLocaleString("en-GB", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      
      {/* Details (collapsed by default) */}
      {log.details && Object.keys(log.details).length > 0 && (
        <details className="group">
          <summary className="text-xs text-primary cursor-pointer hover:underline">
            View details
          </summary>
          <div className="mt-2 bg-muted/30 border border-border/60 rounded-lg p-2 max-h-32 overflow-auto text-[10px] text-muted-foreground font-mono leading-relaxed">
            {typeof log.details === "string"
              ? log.details
              : JSON.stringify(log.details, null, 2)}
          </div>
        </details>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await safeGetAuditLogs({ limit: 100, offset: 0 });
        const typedRes: any = res;

        const logsData = Array.isArray(typedRes?.data)
          ? typedRes.data
              .map((log: any) => ({
                id: log.id,
                event_type: log.event_type || log.event || "UNKNOWN",
                document_id: log.document_id || log.reference_id || null,
                user: log.user || log.username || null,
                user_role: log.user_role || log.role || null,
                timestamp: log.timestamp || log.created_at,
                details: log.details || log.payload || {},
              }))
              .filter(
                (log: any) =>
                  log.event_type !== "DECISIONS_FILTERED" &&
                  log.event_type !== "COMPLIANCE_FETCHED"
              )
              .sort(
                (a: any, b: any) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
          : [];

        setLogs(logsData);
      } catch (err) {
        console.error("Failed to load audit logs", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    const interval = setInterval(loadLogs, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const text = JSON.stringify(log).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "Full access to all system audit events."
            : "Read-only view of compliance audit events."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search logs by document ID, event, user..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-2 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ScrollText className="h-4 w-4" />
            {logs.length} events recorded
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading audit logs...
            </div>
          ) : (
            <>
              {/* Mobile view - Card list */}
              <div className="md:hidden p-3 space-y-3">
                {paginatedLogs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No matching audit events
                  </div>
                ) : (
                  paginatedLogs.map((log) => (
                    <MobileAuditLogCard key={log.id} log={log} />
                  ))
                )}
              </div>
              
              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No matching audit events
                        </TableCell>
                      </TableRow>
                    )}

                    {paginatedLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="border-border/50 hover:bg-muted/50 transition-colors duration-150"
                      >
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-[11px] font-medium tracking-wide px-2 py-[2px]",
                              EVENT_TYPE_COLORS[log.event_type] ||
                                "bg-secondary text-secondary-foreground"
                            )}
                          >
                            {(log.event_type ?? "UNKNOWN").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-foreground">
                              {log.user ?? "SYSTEM"}
                            </span>

                            {log.user_role && (
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px] px-1 py-0 border-muted-foreground/30 text-muted-foreground"
                              >
                                {log.user_role}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs text-primary">
                          {log.document_id ? log.document_id : "-"}
                        </TableCell>

                        <TableCell className="text-xs whitespace-nowrap">
                          {(() => {
                            const ts = new Date(log.timestamp)
                            const now = new Date()
                            const diff = Math.floor((now.getTime() - ts.getTime()) / 1000)

                            let relative = `${diff}s ago`
                            if (diff > 60) relative = `${Math.floor(diff / 60)}m ago`
                            if (diff > 3600) relative = `${Math.floor(diff / 3600)}h ago`
                            if (diff > 86400) relative = `${Math.floor(diff / 86400)}d ago`

                            const formatted = ts.toLocaleString("en-GB", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                              timeZoneName: "short"
                            })

                            return (
                              <>
                                <div className="text-foreground font-semibold text-[12px]">
                                  {formatted}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {relative}
                                </div>
                              </>
                            )
                          })()}
                        </TableCell>

                        <TableCell className="max-w-md text-xs">
                          <div className="bg-muted/30 border border-border/60 rounded-lg p-3 max-h-40 overflow-auto text-[11px] text-muted-foreground font-mono leading-relaxed shadow-sm">
                            {typeof log.details === "string"
                              ? log.details
                              : (() => {
                                  try {
                                    const formatted = JSON.stringify(log.details, null, 2)

                                    if (formatted.includes('"decision": "APPROVED"')) {
                                      return <span className="text-emerald-600">{formatted}</span>
                                    }

                                    if (formatted.includes('"decision": "REJECTED"')) {
                                      return <span className="text-red-600">{formatted}</span>
                                    }

                                    return formatted
                                  } catch {
                                    return JSON.stringify(log.details)
                                  }
                                })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
