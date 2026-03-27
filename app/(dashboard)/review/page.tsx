"use client"

import { useEffect, useState } from "react"

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
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Compliance Review Queue</h1>

      {loading ? (
        <p>Loading review queue...</p>
      ) : documents.length === 0 ? (
        <p>No documents awaiting review.</p>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="border rounded-lg p-6 shadow-sm bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono text-sm text-gray-600">
                    {doc.document_id}
                  </div>

                  <div className="text-lg font-medium mt-1">
                    {doc.document_type}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    doc.risk_level === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : doc.risk_level === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {doc.risk_level}
                </span>
              </div>

              <div className="text-sm text-gray-700 mb-2">
                <strong>Compliance Flags:</strong>{" "}
                {doc.flags?.length ? doc.flags.join(", ") : "None"}
              </div>

              {doc.compliance_score !== undefined && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Compliance Score:</strong> {doc.compliance_score}
                </div>
              )}

              {doc.pii_detected && doc.pii_detected.length > 0 && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Detected PII:</strong> {doc.pii_detected.join(", ")}
                </div>
              )}

              {doc.analysis_metadata?.trigger_sentences &&
                doc.analysis_metadata.trigger_sentences.length > 0 && (
                  <div className="text-sm text-gray-700 mb-3">
                    <strong>Highlighted Clauses:</strong>
                    <ul className="list-disc ml-5 mt-1 text-gray-600">
                      {doc.analysis_metadata.trigger_sentences.map(
                        (sentence: string, index: number) => (
                          <li key={index}>{sentence}</li>
                        )
                      )}
                    </ul>
                  </div>
              )}

              {doc.explanation && (
                <div className="text-sm text-gray-700 mb-4">
                  <strong>AI Explanation:</strong>
                  <div className="mt-1 text-gray-600">
                    {typeof doc.explanation === "string"
                      ? doc.explanation
                      : doc.explanation?.summary ||
                        doc.explanation?.reasoning ||
                        ""}
                  </div>
                </div>
              )}

              {/* Reviewer Comment */}
              <div className="mb-3">
                <label className="text-sm font-medium">
                  Reviewer Comment
                </label>
                <textarea
                  className="w-full mt-1 border rounded p-2 text-sm"
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

              {/* Risk Override */}
              <div className="mb-3">
                <label className="text-sm font-medium">
                  Override Risk Level
                </label>
                <select
                  className="w-full mt-1 border rounded p-2 text-sm"
                  value={overrideRisk[doc.document_id] || ""}
                  onChange={(e) =>
                    setOverrideRisk({
                      ...overrideRisk,
                      [doc.document_id]: e.target.value,
                    })
                  }
                >
                  <option value="">Use AI Decision</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* Status Override */}
              <div className="mb-4">
                <label className="text-sm font-medium">
                  Override Compliance Status
                </label>
                <select
                  className="w-full mt-1 border rounded p-2 text-sm"
                  value={overrideStatus[doc.document_id] || ""}
                  onChange={(e) =>
                    setOverrideStatus({
                      ...overrideStatus,
                      [doc.document_id]: e.target.value,
                    })
                  }
                >
                  <option value="">Use AI Decision</option>
                  <option value="COMPLIANT">COMPLIANT</option>
                  <option value="REVIEW_REQUIRED">REVIEW_REQUIRED</option>
                  <option value="NON_COMPLIANT">NON_COMPLIANT</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openDocument(doc.document_id)}
                  className="px-3 py-2 bg-gray-200 rounded text-sm"
                >
                  View Document
                </button>

                <button
                  onClick={() =>
                    handleDecision(doc.document_id, "APPROVED")
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    handleDecision(doc.document_id, "REJECTED")
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}