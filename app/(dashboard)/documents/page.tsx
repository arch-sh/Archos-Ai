"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { safeGetDecisions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import type { RiskLevel, ComplianceStatus, DecisionRecord } from "@/lib/types";

const PAGE_SIZE = 5;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DecisionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  useEffect(() => {
    const load = async () => {
      // Allow page to fetch documents immediately; token is read by api.ts
      // If user exists but does not have permission, show empty list
      if (user && user.role !== "Admin" && user.role !== "Analyst") {
        setDocuments([]);
        setTotal(0);
        setLoading(false);
        return;
      }
  
      setLoading(true);
      try {
        const response = await safeGetDecisions({
          risk_level: riskFilter !== "ALL" ? riskFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          document_id: searchQuery || undefined,
          limit: PAGE_SIZE,
          offset,
        });
  
        setDocuments(
          (response.data || []).map((item) => ({
            ...item,
            confidence:
              item.confidence !== undefined && item.confidence !== null
                ? Number(item.confidence)
                : 0,
          }))
        );
  
        setTotal(response.total || 0);
      } finally {
        setLoading(false);
      }
    };
  
    load();
  }, [riskFilter, statusFilter, searchQuery, offset, user]);

  if (user && user.role === "Reviewer") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="text-muted-foreground">
          You do not have permission to view document listings.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review compliance analysis results for all processed documents.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => {
                setOffset(0);
                setSearchQuery(e.target.value);
              }}
              className="pl-9"
              disabled={loading}
            />
          </div>

          <Select
            value={riskFilter}
            onValueChange={(v) => {
              setOffset(0);
              setRiskFilter(v as RiskLevel | "ALL");
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Risks</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setOffset(0);
              setStatusFilter(v as ComplianceStatus | "ALL");
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLIANT">Compliant</SelectItem>
              <SelectItem value="NON_COMPLIANT">Non-Compliant</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            {total} document{total !== 1 ? "s" : ""} found
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No documents found.
            </div>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.map((doc, index) => (
                  <TableRow
                    key={doc.document_id || index}
                    className="hover:bg-muted/40 transition-colors h-12"
                  >
                    <TableCell className="py-3">
                      <Link
                        href={`/documents/${doc.document_id}`}
                        className="group flex flex-col"
                        title={doc.document_id}
                      >
                        <span className="font-medium text-primary group-hover:underline">
                          { (doc as any).document_name
                            ? (doc as any).document_name
                            : `Document ${doc.document_id.slice(0, 8)}`
                          }
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: …{doc.document_id.slice(-6)}
                        </span>
                      </Link>
                    </TableCell>

                    <TableCell className="py-3">
                      {doc.document_type}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        className={cn(
                          String(doc.risk_level) === "CRITICAL" || String(doc.risk_level) === "HIGH"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : String(doc.risk_level) === "MEDIUM"
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        )}
                      >
                        {doc.risk_level}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        className={cn(
                          doc.status === "COMPLIANT"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : doc.status === "REVIEW_REQUIRED"
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        )}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-40 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {(doc.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              String(doc.risk_level) === "CRITICAL" || String(doc.risk_level) === "HIGH"
                                ? "bg-red-600"
                                : String(doc.risk_level) === "MEDIUM"
                                ? "bg-amber-500"
                                : "bg-emerald-600"
                            )}
                            style={{
                              width: `${(doc.confidence * 100).toFixed(0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Link href={`/documents/${doc.document_id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-muted"
                          title="Open document analysis"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              disabled={offset + PAGE_SIZE >= total || loading}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}