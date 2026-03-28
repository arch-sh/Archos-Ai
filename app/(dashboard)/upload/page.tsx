"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, FileText, Search, Brain, CheckCircle, Loader2, AlertCircle } from "lucide-react"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [pipelineStage, setPipelineStage] = useState<string>("IDLE")

  const API_URL =
    process.env.NEXT_PUBLIC_UPLOAD_API_URL ||
    "https://upload-service-472639005661.asia-south1.run.app/api/v1/documents/upload"

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    setStatus("Uploading document to processing pipeline...")

    try {
      const token = localStorage.getItem("access_token")

      let userHeaders: Record<string, string> = {}

      if (token) {
        try {
          const payload = token.split(".")[1]
          const decoded = JSON.parse(atob(payload))

          userHeaders = {
            Authorization: `Bearer ${token}`,
            "x-user-id": decoded.sub || "SYSTEM",
            "x-username": decoded.sub || "SYSTEM",
            "x-user-role": decoded.role || "SYSTEM",
          }
        } catch {
          // fallback if token decoding fails
        }
      }

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: userHeaders,
        mode: "cors",
        credentials: "omit",
      })

      if (res.status === 202 || res.ok) {
        let data: any = null

        try {
          data = await res.json()
        } catch {
          // backend may not return JSON
        }

        if (data?.document_id) {
          setDocumentId(data.document_id)
          setPipelineStage("UPLOADED")
          setStatus(
            `Document uploaded successfully. Processing started. Document ID: ${data.document_id}`
          )
        } else {
          setStatus(
            "Upload accepted. OCR and compliance analysis are now running in the pipeline."
          )
        }
      } else {
        throw new Error(`Upload failed with status ${res.status}`)
      }
    } catch (err) {
      console.error("UPLOAD NETWORK ERROR:", err)

      setStatus(
        "Upload request could not reach the backend. Check if upload-service is running on port 8001."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!documentId) return

    const interval = setInterval(async () => {
      try {
        const DECISIONS_API =
          process.env.NEXT_PUBLIC_COMPLIANCE_API_URL ||
          "https://compliance-store-472639005661.asia-south1.run.app"

        const token = localStorage.getItem("access_token")

        const headers: Record<string, string> = {}

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const res = await fetch(
          `${DECISIONS_API}/decisions?document_id=${documentId}`,
          {
            headers,
          }
        )

        if (!res.ok) return

        const data = await res.json()

        if (data?.data?.length) {
          const doc = data.data[0]

          if (
            doc.status === "COMPLIANT" ||
            doc.status === "NON_COMPLIANT" ||
            doc.status === "REVIEW_REQUIRED" ||
            doc.status === "NOT_APPLICABLE"
          ) {
            setPipelineStage("COMPLETED")
            setStatus(
              `Compliance analysis completed. Risk Level: ${doc.risk_level}`
            )
            clearInterval(interval)
          } else {
            setPipelineStage("ANALYZING")
          }
        } else {
          setPipelineStage("OCR_RUNNING")
        }
      } catch {
        // silent retry
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [documentId])

  const pipelineSteps = [
    { 
      key: "upload", 
      label: "Upload", 
      icon: FileText,
      active: pipelineStage !== "IDLE" 
    },
    { 
      key: "ocr", 
      label: "OCR", 
      icon: Search,
      active: pipelineStage === "OCR_RUNNING" || pipelineStage === "ANALYZING" || pipelineStage === "COMPLETED" 
    },
    { 
      key: "analysis", 
      label: "AI Analysis", 
      icon: Brain,
      active: pipelineStage === "ANALYZING" || pipelineStage === "COMPLETED" 
    },
    { 
      key: "complete", 
      label: "Complete", 
      icon: CheckCircle,
      active: pipelineStage === "COMPLETED" 
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Document Upload
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload documents to run OCR extraction, AI compliance analysis, and risk evaluation.
        </p>
      </div>

      {/* Upload Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base">Select Document</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <div className={cn(
                "border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors",
                file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}>
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <p className="text-sm font-medium truncate max-w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop a file or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Supported: PDF, JPG, PNG
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Analyze
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Visualization */}
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base">Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4">
          {/* Pipeline steps */}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {pipelineSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 md:p-4 border rounded-xl transition-all text-center",
                    step.active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                      : "bg-muted/50 border-border text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="text-[10px] md:text-xs font-medium">{step.label}</span>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            After upload, your document moves through the automated compliance pipeline.
            Results will appear in the Documents dashboard once processing completes.
          </p>
        </CardContent>
      </Card>

      {/* Status */}
      {status && (
        <Card className={cn(
          "border",
          status.includes("error") || status.includes("could not")
            ? "border-destructive/50 bg-destructive/5"
            : status.includes("completed") || status.includes("successfully")
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-primary/50 bg-primary/5"
        )}>
          <CardContent className="p-4 flex items-start gap-3">
            {status.includes("error") || status.includes("could not") ? (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            ) : status.includes("completed") || status.includes("successfully") ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{status}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
