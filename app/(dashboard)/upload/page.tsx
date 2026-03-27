"use client"

import { useState, useEffect } from "react"

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
      // ----------------------------------------
      // Attach user identity from JWT
      // ----------------------------------------
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

      // If backend accepted the upload
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

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📤 AI Compliance Document Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload documents to automatically run 🔍 OCR extraction, 🧠 AI compliance
          analysis, and ⚖️ risk evaluation through the intelligent pipeline.
        </p>
      </div>

      {/* Upload Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 p-6 space-y-4 bg-background/80 backdrop-blur shadow-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select Document
          </label>

          <input
            type="file"
            className="border rounded-md p-2 w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <p className="text-xs text-muted-foreground">
            Supported: PDF, JPG, PNG. The system will automatically extract
            text and run compliance analysis.
          </p>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "⏳ Processing..." : "🚀 Upload & Analyze"}
        </button>
      </div>

      {/* Pipeline Visualization */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 p-6 space-y-4 bg-background/80 backdrop-blur shadow-lg">
        <h2 className="font-semibold text-lg">⚙️ Processing Pipeline</h2>

        <div className="grid grid-cols-4 gap-4 text-center text-sm">

          {/* Upload */}
          <div
            className={`p-4 border border-border/60 rounded-xl transition-all shadow-sm font-medium
            ${
              pipelineStage !== "IDLE"
                ? "bg-green-700 text-white border-green-700"
                : "bg-muted"
            }`}
          >
            📄
            <div>Upload</div>
          </div>

          {/* OCR */}
          <div
            className={`p-4 border border-border/60 rounded-xl transition-all shadow-sm font-medium
            ${
              pipelineStage === "OCR_RUNNING" ||
              pipelineStage === "ANALYZING" ||
              pipelineStage === "COMPLETED"
                ? "bg-green-700 text-white border-green-700"
                : "bg-muted"
            }`}
          >
            🔍
            <div>OCR</div>
          </div>

          {/* AI Analysis */}
          <div
            className={`p-4 border border-border/60 rounded-xl transition-all shadow-sm font-medium
            ${
              pipelineStage === "ANALYZING" ||
              pipelineStage === "COMPLETED"
                ? "bg-green-700 text-white border-green-700"
                : "bg-muted"
            }`}
          >
            🧠
            <div>AI Analysis</div>
          </div>

          {/* Compliance */}
          <div
            className={`p-4 border border-border/60 rounded-xl transition-all shadow-sm font-medium
            ${
              pipelineStage === "COMPLETED"
                ? "bg-green-700 text-white border-green-700"
                : "bg-muted"
            }`}
          >
            ✅
            <div>Compliance Result</div>
          </div>

        </div>

        <p className="text-xs text-muted-foreground">
          After upload, your document moves through the automated compliance pipeline ⚙️.
          Results will appear in the 📊 Documents dashboard once processing completes.
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className="border rounded-md p-4 text-sm bg-muted flex items-center gap-2">
          {status}
        </div>
      )}
    </div>
  )
}