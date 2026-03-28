"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Brain,
  Loader2
} from "lucide-react"

const API_BASE =
  process.env.NEXT_PUBLIC_COMPLIANCE_API_URL || "http://127.0.0.1:8003"

export default function ReviewPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [comments, setComments] = useState<Record<string, string>>({})
  const [overrideRisk, setOverrideRisk] = useState<Record<string, string>>({})
  const [overrideStatus, setOverrideStatus] = useState<Record<string, string>>({})

  const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  }

  const fetchPendingReviews = async () => {
    try {
      const token = getToken()

      if (!token) {
        console.warn("No auth token found, redirecting to login")
        window.location.href = "/login"
        return
      }

      const res = await fetch(`${API_BASE}/review/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()

      if (Array.isArray(data)) {
        setDocuments(data)
      } else if (Array.isArray(data.data)) {
        setDocuments(data.data)
      } else {
        setDocuments([])
      }
    } catch (err) {
      console.error("Failed to fetch pending reviews", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const handleDecision = async (documentId: string, decision: string) => {
    try {
      await fetch(`${API_BASE}/review/${documentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          decision,
          comment: comments[documentId] || "",
          override_risk: overrideRisk[documentId] || null,
          override_status: overrideStatus[documentId] || null,
        }),
      })

      fetchPendingReviews()
    } catch (err) {
      console.error("Review decision failed", err)
    }
  }

  const openDocument = (documentId: string) => {
    window.open(`/documents/${documentId}`, "_blank")
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Compliance Review Queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve documents pending compliance decisions.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading review queue...</p>
        </div>
      ) : documents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500/30" />
            <h3 className="mt-4 text-lg font-medium">All Clear</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No documents awaiting review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {documents.map((doc) => (
            <Card key={doc.document_id} className="glass-card overflow-hidden">
              <CardHeader className="pb-3 px-4 md:px-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base md:text-lg truncate">
                        {doc.document_type || "Document"}
                      </CardTitle>
                      <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                        {doc.document_id}
                      </p>
                    </div>
                  </div>
                  
                  <Badge
                    className={cn(
                      "shrink-0 self-start",
                      doc.risk_level === "HIGH" || doc.risk_level === "CRITICAL"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : doc.risk_level === "MEDIUM"
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    )}
                  >
                    {doc.risk_level} Risk
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-4 md:px-6 space-y-4">
                {/* Document details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Compliance Flags</p>
                    <p className="font-medium">
                      {doc.flags?.length ? doc.flags.join(", ") : "None"}
                    </p>
                  </div>
                  
                  {doc.compliance_score !== undefined && (
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
                      <p className="font-medium">{doc.compliance_score}</p>
                    </div>
                  )}
                </div>

                {/* PII Detection */}
                {doc.pii_detected && doc.pii_detected.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-destructive mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Detected PII
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.pii_detected.map((pii: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">
                          {pii}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlighted Clauses */}
                {doc.analysis_metadata?.trigger_sentences &&
                  doc.analysis_metadata.trigger_sentences.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Highlighted Clauses
                      </p>
                      <ul className="space-y-1.5">
                        {doc.analysis_metadata.trigger_sentences.map(
                          (sentence: string, index: number) => (
                            <li key={index} className="text-xs text-muted-foreground pl-3 border-l-2 border-amber-500/30">
                              {sentence}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                )}

                {/* AI Explanation */}
                {doc.explanation && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5" />
                      AI Explanation
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {typeof doc.explanation === "string"
                        ? doc.explanation
                        : doc.explanation?.summary ||
                          doc.explanation?.reasoning ||
                          ""}
                    </p>
                  </div>
                )}

                {/* Reviewer inputs */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Reviewer Comment
                    </label>
                    <Textarea
                      className="mt-1.5 text-sm"
                      rows={2}
                      placeholder="Optional comment..."
                      value={comments[doc.document_id] || ""}
                      onChange={(e) =>
                        setComments({
                          ...comments,
                          [doc.document_id]: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Override Risk Level
                      </label>
                      <Select
                        value={overrideRisk[doc.document_id] || ""}
                        onValueChange={(v) =>
                          setOverrideRisk({
                            ...overrideRisk,
                            [doc.document_id]: v,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Use AI Decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Use AI Decision</SelectItem>
                          <SelectItem value="LOW">LOW</SelectItem>
                          <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                          <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Override Compliance Status
                      </label>
                      <Select
                        value={overrideStatus[doc.document_id] || ""}
                        onValueChange={(v) =>
                          setOverrideStatus({
                            ...overrideStatus,
                            [doc.document_id]: v,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Use AI Decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Use AI Decision</SelectItem>
                          <SelectItem value="COMPLIANT">COMPLIANT</SelectItem>
                          <SelectItem value="REVIEW_REQUIRED">REVIEW_REQUIRED</SelectItem>
                          <SelectItem value="NON_COMPLIANT">NON_COMPLIANT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDocument(doc.document_id)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Document
                  </Button>

                  <div className="flex-1" />

                  <Button
                    size="sm"
                    onClick={() => handleDecision(doc.document_id, "APPROVED")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDecision(doc.document_id, "REJECTED")}
                    className="gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
