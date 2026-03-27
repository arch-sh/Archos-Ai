"use client";

import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeGetDecisionById, safeGetAuditLogs, safeGetSignedUrl } from "@/lib/api";
import type { ComplianceDocument } from "@/lib/types";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { ShieldCheck, Brain, FileText, AlertTriangle, Lock, Activity } from "lucide-react";
import jsPDF from "jspdf";

export default function DocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params?.documentId as string;

  const [decision, setDecision] = useState<ComplianceDocument | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ filename: string; content_type: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const PIPELINE_STAGES = [
    { success: "DOCUMENT_UPLOADED", failure: null },
    { success: "OCR_COMPLETED", failure: "OCR_FAILED" },
    { success: "ANALYSIS_COMPLETED", failure: "ANALYSIS_FAILED" },
    { success: "COMPLIANCE_STORED", failure: "COMPLIANCE_FAILED" },
  ];

  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const doc = await safeGetDecisionById(documentId);

        if (!doc) {
          notFound();
          return false;
        }

        setDecision(doc as ComplianceDocument);

        const logsResponse: any = await safeGetAuditLogs({
          document_id: documentId,
          limit: 50,
          offset: 0,
        });

        const logs = (logsResponse?.data ?? []) as any[];

        const filteredLogs = logs.filter(
          (log: any) =>
            ![
              "COMPLIANCE_FETCHED",
              "DECISION_FETCHED",
              "SIGNED_URL_FETCHED"
            ].includes(log.event)
        );

        // sort logs chronologically (important for pipeline UI)
        const sortedLogs = filteredLogs.sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setAuditLogs(sortedLogs);

        const isComplete = logs.some(
          (log: any) =>
            log.event === "COMPLIANCE_STORED" ||
            log.event === "COMPLIANCE_COMPLETED" ||
            log.event === "DECISION_CREATED"
        );

        return isComplete;
      } catch (error) {
        console.error("Failed to load document", error);
        return false;
      } finally {
        setLoading(false);
      }
    };

    const startPolling = async () => {
      const completed = await load();

      if (!completed) {
        intervalId = setInterval(async () => {
          const done = await load();
          if (done && intervalId) {
            clearInterval(intervalId);
          }
        }, 5000);
      }
    };

    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [documentId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!decision) {
    notFound();
  }

  const eventsMap = new Map(auditLogs.map((log) => [log.event, log]));

  let highestCompletedIndex = -1;

  PIPELINE_STAGES.forEach((stage, index) => {
    if (eventsMap.has(stage.success)) highestCompletedIndex = index;
  });

  const timeline = PIPELINE_STAGES.map((stageDef, index) => {
    const successEvent = stageDef.success;
    const failureEvent = stageDef.failure;

    const successLog = eventsMap.get(successEvent);
    const failureLog = failureEvent ? eventsMap.get(failureEvent) : null;

    if (failureLog) {
      return {
        label: successEvent.replace(/_/g, " "),
        status: "failed",
        timestamp: failureLog.created_at,
        error: failureLog.details?.error || null,
      };
    }

    if (successLog) {
      return {
        label: successEvent.replace(/_/g, " "),
        status: "completed",
        timestamp: successLog.created_at,
        error: null,
      };
    }

    if (index <= highestCompletedIndex) {
      return {
        label: successEvent.replace(/_/g, " "),
        status: "completed",
        timestamp:
          (decision as any)?.evaluated_at ??
          (decision as any)?.created_at ??
          null,
        error: null,
      };
    }

    return {
      label: successEvent.replace(/_/g, " "),
      status: "pending",
      timestamp: null,
      error: null,
    };
  });

  const handlePreview = async () => {
    try {
      setLoadingPreview(true);

      const data: any = await safeGetSignedUrl(decision.document_id);
      console.log("SIGNED URL RESPONSE:", data);

// handle multiple backend response formats
      const url = data?.signed_url || data?.url || data?.data?.signed_url;

      if (!url) {
        console.error("Invalid signed URL response", data);
        alert("Failed to load document preview");
        return;
      }

      setSignedUrl(url);
      setFileMeta({
        filename: data.filename,
        content_type: data.content_type,
      });


      setPreviewOpen(true);
    } catch (error) {
      console.error("Failed to fetch signed URL", error);
      alert("Error loading document preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const askAssistant = async () => {
    if (!assistantQuestion.trim()) return;

    try {
      setAssistantLoading(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_COMPLIANCE_API_URL ||
        "https://compliance-store-472639005661.asia-south1.run.app";

        const token = localStorage.getItem("access_token");

        const res = await fetch(`${baseUrl}/assistant/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            document_id: decision?.document_id,
            question: assistantQuestion,
          }),
        });

      if (!res.ok) {
        setAssistantAnswer("Assistant failed to respond.");
        return;
      }

      const data = await res.json();
      setAssistantAnswer(data.answer || "No answer returned.");
    } catch (err) {
      console.error("Assistant error", err);
      setAssistantAnswer("Assistant encountered an error.");
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      if (!decision?.document_id) {
        console.error("Document ID missing — cannot generate report");
        return;
      }
      const baseUrl =
        process.env.NEXT_PUBLIC_COMPLIANCE_API_URL ||
        "https://compliance-store-472639005661.asia-south1.run.app";
      const response = await fetch(
        `${baseUrl}/compliance/${decision?.document_id}/report`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to generate compliance report");
        return;
      }

      const data = await response.json();

      const pdf = new jsPDF();

      const text = JSON.stringify(data, null, 2);

      const lines = pdf.splitTextToSize(text, 180);

      pdf.text(`Compliance Report`, 10, 10);
      pdf.text(`Document ID: ${decision.document_id}`, 10, 18);

      pdf.text(lines, 10, 30);

      pdf.save(`compliance_report_${decision.document_id}.pdf`);
    } catch (err) {
      console.error("Download report failed", err);
    }
  };

  const confidencePercent = (decision.confidence * 100).toFixed(1);
  const riskLevel = String(decision.risk_level);

  const confidenceColor =
    ["CRITICAL", "HIGH"].includes(riskLevel)
      ? "bg-red-600"
      : riskLevel === "MEDIUM"
      ? "bg-amber-500"
      : "bg-emerald-600";

  const triggerSentences: string[] = (
    (decision as any)?.analysis_metadata?.trigger_sentences ||
    (decision as any)?.analysis_metadata?.highlighted_clauses ||
    []
  ) as string[];

  // Extract additional analysis metadata for richer UI
  const analysisMeta = (decision as any)?.analysis_metadata || {};
  const financialSignals: string[] = analysisMeta?.financial_signals || [];
  const legalSignals: string[] = analysisMeta?.legal_signals || [];

  // Split explanation and reasoning trace if present
  let explanationText = decision.explanation;
  let reasoningTrace: string[] = [];

  if (decision.explanation?.includes("AI Reasoning Trace:")) {
    const parts = decision.explanation.split("AI Reasoning Trace:");
    explanationText = parts[0].trim();
    reasoningTrace = parts[1]
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">

          <div className="flex flex-col gap-2">

            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Document Identifier
            </div>

            <div className="flex items-center gap-3 flex-wrap">

              <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
                {fileMeta?.filename || decision.document_id}
              </div>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(decision.document_id)
                }
                className="text-xs text-primary hover:underline"
              >
                Copy ID
              </button>

              <button
                onClick={handlePreview}
                className="text-xs bg-primary text-white px-3 py-1 rounded-md hover:opacity-90"
                disabled={loadingPreview}
              >
                {loadingPreview ? "Loading..." : "View Document"}
              </button>
              <button
                onClick={handleDownloadReport}
                className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-md hover:opacity-90"
              >
                Download Report
              </button>

            </div>
          </div>

          <div className="flex gap-2">
            <Badge
              className={
                riskLevel === "CRITICAL" || riskLevel === "HIGH"
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : riskLevel === "MEDIUM"
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-300"
              }
            >
              {decision.risk_level}
            </Badge>
            <Badge
              className={
                String(decision.status) === "COMPLIANT"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : String(decision.status) === "REVIEW_REQUIRED"
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }
            >
              {decision.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Document Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Document Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Document Type
            </div>
            <div className="text-sm font-medium">
              {decision.document_type || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Risk Level
            </div>
            <div className="text-sm font-medium">{decision.risk_level}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Compliance Status
            </div>
            <div className="text-sm font-medium">{decision.status}</div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Compliance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/40 border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Risk Level</div>
              <div className="font-semibold text-sm">{decision.risk_level}</div>
            </div>
            <div className="bg-muted/40 border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Compliance Status</div>
              <div className="font-semibold text-sm">{decision.status}</div>
            </div>
            <div className="bg-muted/40 border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Model Confidence</div>
              <div className="font-semibold text-sm">{confidencePercent}%</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Model Confidence
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${confidenceColor} transition-all`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {confidencePercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Summary */}
      {(decision as any)?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Document Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="p-4 bg-muted/60 border rounded-md text-sm leading-relaxed">
              {(decision as any).summary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Explanation */}
      {decision.explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              AI Compliance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/40 space-y-4">

              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Automated Risk Assessment
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {explanationText}
              </p>

              {reasoningTrace.length > 0 && (
                <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    AI Reasoning Trace
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {reasoningTrace.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {triggerSentences.length > 0 && (
                <div className="mt-3 border rounded-md p-3 bg-primary/5">

                  <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                    Triggered Clauses
                  </div>

                  <ul className="space-y-2">
                    {triggerSentences.map((sentence, index) => (
                      <li
                        key={index}
                        className="text-xs leading-relaxed border rounded-md px-2 py-1 bg-background"
                      >
                        "{sentence}"
                      </li>
                    ))}
                  </ul>

                </div>
              )}

            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Compliance Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            AI Compliance Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="text-sm text-muted-foreground">
            Ask questions about this document's compliance analysis.
          </div>

          <div className="flex gap-2">
            <input
              placeholder="Example: Does this document contain personal data?"
              value={assistantQuestion}
              onChange={(e) => setAssistantQuestion(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
            />

            <button
              onClick={askAssistant}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm"
              disabled={assistantLoading}
            >
              {assistantLoading ? "Thinking..." : "Ask"}
            </button>
          </div>

          {assistantAnswer && (
            <div className="border rounded-md p-3 bg-muted/40 text-sm leading-relaxed">
              {assistantAnswer}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Triggered Rules */}
      {decision.flags?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Compliance Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {decision.flags.map((flag) => (
                <Badge
                  key={flag}
                  className="bg-destructive/10 text-destructive border border-destructive/20"
                >
                  {flag}
                </Badge>
              ))}
            </div>

            {financialSignals.length > 0 && (
              <div className="mt-3">
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Financial Indicators
                </div>
                <div className="flex flex-wrap gap-2">
                  {financialSignals.map((signal) => (
                    <Badge key={signal} className="bg-blue-100 text-blue-700 border border-blue-300">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {legalSignals.length > 0 && (
              <div className="mt-3">
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Legal Indicators
                </div>
                <div className="flex flex-wrap gap-2">
                  {legalSignals.map((signal) => (
                    <Badge key={signal} className="bg-purple-100 text-purple-700 border border-purple-300">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detected Sensitive Data (PII) */}
      {(decision as any)?.pii_detected && (decision as any).pii_detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-amber-600" />
              Sensitive Data Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(decision as any).pii_detected.map((pii: string) => (
                <Badge
                  key={pii}
                  className="bg-amber-100 text-amber-800 border border-amber-300"
                >
                  {pii}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Sensitive information detected by the hybrid PII engine (regex + NLP).
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Timeline */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Processing Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {timeline.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className={`h-3 w-3 mt-1 rounded-full ring-2 ring-background ${
                    item.status === "completed"
                      ? "bg-emerald-600 shadow-sm"
                      : item.status === "failed"
                      ? "bg-red-600 shadow-sm"
                      : "bg-gray-300"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.status === "completed" && item.timestamp && (
                    <div className="text-xs text-emerald-700 font-medium">
                      Completed at {new Date(item.timestamp).toLocaleString()}
                    </div>
                  )}
                  {item.status === "failed" && (
                    <div className="text-xs text-red-700 font-medium">
                      Failed at {new Date(item.timestamp).toLocaleString()}
                    </div>
                  )}
                  {item.status === "pending" && (
                    <div className="text-xs text-muted-foreground italic">
                      Waiting for processing...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Human Review Decision */}
      {(decision as any)?.review_status && (decision as any).review_status !== "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Human Review Decision
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            <div className="grid md:grid-cols-3 gap-4">

              <div className="bg-muted/40 border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Reviewer Decision</div>
                <div className="font-semibold text-sm">
                  {(decision as any).review_status}
                </div>
              </div>

              <div className="bg-muted/40 border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Final Risk Level</div>
                <div className="font-semibold text-sm">
                  {decision.risk_level}
                </div>
              </div>

              <div className="bg-muted/40 border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Final Compliance Status</div>
                <div className="font-semibold text-sm">
                  {decision.status}
                </div>
              </div>

            </div>

            {(decision as any)?.review_comment && (
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Reviewer Comment
                </div>
                <div className="text-sm">
                  {(decision as any).review_comment}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}
      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <Card>

          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            {auditLogs.map((log) => (

              <div
                key={log.id}
                className="border rounded-md p-3 text-sm space-y-1 bg-muted/20 hover:bg-muted/40 transition shadow-sm"
              >

                <div className="flex justify-between">

                  <span className="font-medium">
                    {log.event.replace(/_/g, " ")}
                  </span>

                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>

                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground space-y-1">

                    {Object.entries(log.details).map(([key, value]) => (

                      <div key={key}>

                        <span className="font-medium capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        {String(value)}

                      </div>

                    ))}

                  </div>
                )}

              </div>

            ))}

          </CardContent>
        </Card>
      )}

      {/* Document Preview Modal */}
      {previewOpen && signedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

          <div className="bg-white w-[90%] h-[90%] rounded-lg shadow-lg flex flex-col">

            <div className="flex justify-between items-center px-4 py-3 border-b">

              <div className="font-medium">
                {fileMeta?.filename || "Document Preview"}
              </div>

              <button
                onClick={() => setPreviewOpen(false)}
                className="text-sm text-muted-foreground hover:text-black"
              >
                Close
              </button>

            </div>

            <div className="flex-1 overflow-auto">

              {fileMeta?.content_type?.includes("image") && (
                <img
                  src={signedUrl}
                  alt="Document"
                  className="max-w-full max-h-full mx-auto"
                />
              )}

              {fileMeta?.content_type?.includes("pdf") && (
                <iframe
                  src={signedUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              )}

              {!fileMeta?.content_type && (
                <div className="p-4 text-sm text-muted-foreground">
                  Preview not supported for this file type.
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}








// "use client";

// import { notFound, useParams } from "next/navigation";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { safeGetDecisionById, safeGetAuditLogs } from "@/lib/api";
// import { safeGetSignedUrl } from "@/lib/api";
// import type { ComplianceDocument } from "@/lib/types";
// import { useState, useEffect } from "react";
// import { useAuth } from "@/components/auth-provider";

// export default function DocumentDetailPage() {
//   const params = useParams<{ documentId: string }>();
//   const documentId = params?.documentId as string;

//   const [decision, setDecision] = useState<ComplianceDocument | null>(null);
//   const [auditLogs, setAuditLogs] = useState<any[]>([]);
//   const [signedUrl, setSignedUrl] = useState<string | null>(null);
//   const [fileMeta, setFileMeta] = useState<{ filename: string; content_type: string } | null>(null);
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [loadingPreview, setLoadingPreview] = useState(false);
//   const PIPELINE_STAGES = [
//     { success: "DOCUMENT_UPLOADED", failure: null },
//     { success: "OCR_COMPLETED", failure: "OCR_FAILED" },
//     { success: "ANALYSIS_COMPLETED", failure: "ANALYSIS_FAILED" },
//     { success: "COMPLIANCE_STORED", failure: "COMPLIANCE_FAILED" },
//   ];
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();

//   useEffect(() => {
//     let intervalId: NodeJS.Timeout | null = null;

//     const load = async () => {
//       // Allow loading even if user is not yet restored after refresh
//       // JWT token from localStorage will still authorize the request

//       try {
//         const doc = await safeGetDecisionById(documentId);

//         if (!doc) {
//           notFound();
//           return false;
//         }

//         setDecision(doc as ComplianceDocument);

//         const logsResponse: any = await safeGetAuditLogs({
//           document_id: documentId,
//           limit: 50,
//           offset: 0,
//         });
//         const logs = (logsResponse?.data ?? []) as any[];
//         const filteredLogs = logs.filter(
//           (log: any) =>
//             log.event !== "COMPLIANCE_FETCHED" &&
//             log.event !== "DECISION_FETCHED"
//         );
//         setAuditLogs(filteredLogs);

//         // Stop polling if pipeline is complete
//         const isComplete = logs.some(
//           (log: any) => log.event === "COMPLIANCE_STORED"
//         );

//         return isComplete;
//       } catch (error) {
//         console.error("Failed to load document", error);
//         return false;
//       } finally {
//         setLoading(false);
//       }
//     };

//     const startPolling = async () => {
//       const completed = await load();

//       if (!completed) {
//         intervalId = setInterval(async () => {
//           const done = await load();
//           if (done && intervalId) {
//             clearInterval(intervalId);
//           }
//         }, 5000);
//       }
//     };

//     startPolling();

//     return () => {
//       if (intervalId) {
//         clearInterval(intervalId);
//       }
//     };
//   }, [documentId, user]);


//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
//       </div>
//     );
//   }

//   if (!decision) {
//     notFound();
//   }

//   const eventsMap = new Map(
//     auditLogs.map((log) => [log.event, log])
//   );

//   // determine the furthest completed stage
//   let highestCompletedIndex = -1;

//   PIPELINE_STAGES.forEach((stage, index) => {
//     if (eventsMap.has(stage.success)) {
//       highestCompletedIndex = index;
//     }
//   });

//   const timeline = PIPELINE_STAGES.map((stageDef, index) => {
//     const successEvent = stageDef.success;
//     const failureEvent = stageDef.failure;

//     const successLog = eventsMap.get(successEvent);
//     const failureLog = failureEvent ? eventsMap.get(failureEvent) : null;

//     if (failureLog) {
//       return {
//         label: successEvent.replace(/_/g, " "),
//         status: "failed",
//         timestamp: failureLog.created_at,
//         error: failureLog.details?.error || null,
//       };
//     }

//     // if we have a log → completed
//     if (successLog) {
//       return {
//         label: successEvent.replace(/_/g, " "),
//         status: "completed",
//         timestamp: successLog.created_at,
//         error: null,
//       };
//     }

//     // if a later stage completed, mark previous as completed
//     if (index <= highestCompletedIndex) {
//       return {
//         label: successEvent.replace(/_/g, " "),
//         status: "completed",
//         timestamp: (decision as any)?.evaluated_at ?? (decision as any)?.created_at ?? null,
//         error: null,
//       };
//     }

//     return {
//       label: successEvent.replace(/_/g, " "),
//       status: "pending",
//       timestamp: null,
//       error: null,
//     };
//   });

//   const handlePreview = async () => {
//     try {
//       setLoadingPreview(true);
//       const data: any = await safeGetSignedUrl(decision.document_id);
//       if (!data) return;
//       setSignedUrl(data.signed_url);
//       setFileMeta({
//         filename: data.filename,
//         content_type: data.content_type,
//       });
//       setPreviewOpen(true);
//     } catch (error) {
//       console.error("Failed to fetch signed URL", error);
//     } finally {
//       setLoadingPreview(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <Card>
//         <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">
//           <div className="flex flex-col gap-2">
//             <div className="text-xs uppercase tracking-wide text-muted-foreground">
//               Document Identifier
//             </div>
//             <div className="flex items-center gap-3 flex-wrap">
//               <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
//                 {fileMeta?.filename || decision.document_id}
//               </div>
//               <button
//                 onClick={() => navigator.clipboard.writeText(decision.document_id)}
//                 className="text-xs text-primary hover:underline"
//               >
//                 Copy ID
//               </button>
//               <button
//                 onClick={handlePreview}
//                 className="text-xs bg-primary text-white px-3 py-1 rounded-md hover:opacity-90"
//                 disabled={loadingPreview}
//               >
//                 {loadingPreview ? "Loading..." : "View Document"}
//               </button>
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <Badge
//               className={
//                 decision.risk_level === "HIGH"
//                   ? "bg-destructive/10 text-destructive"
//                   : "bg-green-100 text-green-700"
//               }
//             >
//               {decision.risk_level}
//             </Badge>
//             <Badge variant="outline">{decision.status}</Badge>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Compliance Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Compliance Overview</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div>
//             <div className="text-sm text-muted-foreground mb-1">
//               Model Confidence
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
//                 <div
//                   className="h-full bg-primary transition-all"
//                   style={{
//                     width: `${(decision.confidence * 100).toFixed(1)}%`,
//                   }}
//                 />
//               </div>
//               <span className="text-sm font-medium">
//                 {(decision.confidence * 100).toFixed(1)}%
//               </span>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* AI Explanation */}
//       {decision.explanation && (
//         <Card>
//           <CardHeader>
//             <CardTitle>AI Explanation</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="p-4 bg-muted rounded-md text-sm leading-relaxed">
//               {decision.explanation}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Triggered Rules */}
//       {decision.flags?.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Triggered Rules</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {decision.flags?.map((flag) => (
//               <Badge key={flag} variant="destructive" className="mr-2">
//                 {flag}
//               </Badge>
//             ))}
//           </CardContent>
//         </Card>
//       )}

//       {/* Pipeline Timeline */}
//       {timeline.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Pipeline Lifecycle</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {timeline.map((item) => (
//               <div key={item.label} className="flex items-start gap-3">
//                 <div
//                   className={`h-3 w-3 mt-1 rounded-full ring-2 ring-background ${
//                     item.status === "completed"
//                       ? "bg-emerald-600 shadow-sm"
//                       : item.status === "failed"
//                       ? "bg-red-600 shadow-sm"
//                       : "bg-gray-300"
//                   }`}
//                 />

//                 <div className="flex-1">
//                   <div className="font-medium">{item.label}</div>

//                   {item.status === "completed" && item.timestamp && (
//                     <div className="text-xs text-emerald-700 font-medium">
//                       Completed at {new Date(item.timestamp).toLocaleString()}
//                     </div>
//                   )}

//                   {item.status === "failed" && (
//                     <div className="text-xs text-red-700 font-medium">
//                       Failed at {new Date(item.timestamp).toLocaleString()}
//                       {item.error && (
//                         <div className="mt-1 text-red-500">
//                           Error: {item.error}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {item.status === "pending" && (
//                     <div className="text-xs text-muted-foreground italic">
//                       Waiting for processing...
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>
//       )}

//       {/* Audit Trail */}
//       {auditLogs.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Audit Trail</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             {auditLogs.map((log) => (
//               <div
//                 key={log.id}
//                 className="border rounded-md p-3 text-sm space-y-1 bg-muted/20 hover:bg-muted/40 transition"
//               >
//                 <div className="flex justify-between">
//                   <span className="font-medium">
//                     {log.event.replace(/_/g, " ")}
//                   </span>
//                   <span className="text-muted-foreground">
//                     {new Date(log.created_at).toLocaleString()}
//                   </span>
//                 </div>

//                 {log.details && Object.keys(log.details).length > 0 && (
//   <div className="mt-1 text-xs text-muted-foreground space-y-1">
//     {Object.entries(log.details).map(([key, value]) => (
//       <div key={key}>
//         <span className="font-medium capitalize">
//           {key.replace(/_/g, " ")}:
//         </span>{" "}
//         {String(value)}
//       </div>
//     ))}
//   </div>
// )}
//               </div>
//             ))}
//           </CardContent>
//         </Card>
//       )}

//       {previewOpen && signedUrl && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
//           <div className="bg-white w-[90%] h-[90%] rounded-lg shadow-lg flex flex-col">
//             <div className="flex justify-between items-center px-4 py-3 border-b">
//               <div className="font-medium">
//                 {fileMeta?.filename || "Document Preview"}
//               </div>
//               <button
//                 onClick={() => setPreviewOpen(false)}
//                 className="text-sm text-muted-foreground hover:text-black"
//               >
//                 Close
//               </button>
//             </div>

//             <div className="flex-1 overflow-auto">
//               {fileMeta?.content_type?.includes("image") && (
//                 <img
//                   src={signedUrl}
//                   alt="Document"
//                   className="max-w-full max-h-full mx-auto"
//                 />
//               )}

//               {fileMeta?.content_type?.includes("pdf") && (
//                 <iframe
//                   src={signedUrl}
//                   className="w-full h-full"
//                   title="PDF Preview"
//                 />
//               )}

//               {!fileMeta?.content_type && (
//                 <div className="p-4 text-sm text-muted-foreground">
//                   Preview not supported for this file type.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
      // Force open in new tab (more reliable for Cloud URLs)