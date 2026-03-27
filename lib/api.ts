// ============================================================
// SatyamAI – Central API Client (JWT VERSION)
// ============================================================

import type {
  ComplianceDocument,
  DecisionRecord,
  HealthCheckResponse,
} from "./types";

const COMPLIANCE_API_BASE = process.env.NEXT_PUBLIC_COMPLIANCE_API_URL;

if (!COMPLIANCE_API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  return token && token !== "null" ? token : null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const token = getToken();

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Preserve existing headers if provided
    if (options?.headers && typeof options.headers === "object") {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    // Attach JWT if present
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Automatically set JSON content type for body requests
    if (options?.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      ...options,
      method: options?.method || "GET",
      headers: headers,
      credentials: "omit",
      cache: "no-store",
    });

    // Handle expired / invalid token
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
      throw new Error("Session expired");
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  async getComplianceDocument(
    documentId: string
  ): Promise<ComplianceDocument> {
    return this.request(`/compliance/${documentId}`);
  }

  async getComplianceReport(documentId: string): Promise<any> {
    return this.request(`/compliance/${documentId}/report`);
  }

  async getDecisions(query?: string): Promise<{
    total: number;
    limit: number;
    offset: number;
    data: DecisionRecord[];
  }> {
    const endpoint = query ? `/decisions?${query}` : "/decisions";
    return this.request(endpoint);
  }

  async getHealth(): Promise<HealthCheckResponse> {
    return this.request("/health");
  }
}

export const complianceApi = new ApiClient(COMPLIANCE_API_BASE);


// ============================================================
// SAFE WRAPPERS
// ============================================================

export async function safeGetDecisions(params?: {
  risk_level?: string;
  status?: string;
  document_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const query = new URLSearchParams();

    if (params?.risk_level) query.append("risk_level", params.risk_level);
    if (params?.status) query.append("status", params.status);
    if (params?.document_id) query.append("document_id", params.document_id);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const qs = query.toString();

    return await complianceApi.getDecisions(qs);
  } catch {
    return { total: 0, limit: 10, offset: 0, data: [] };
  }
}

export async function safeGetDecisionById(documentId: string) {
  try {
    return await complianceApi.getComplianceDocument(documentId);
  } catch {
    return null;
  }
}

export async function getPendingReviews() {
  return complianceApi.request("/review/pending");
}

export async function submitReview(documentId: string, payload: any) {
  return complianceApi.request(`/review/${documentId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function safeGetAuditLogs(params?: {
  document_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const query = new URLSearchParams();

    if (params?.document_id) query.append("document_id", params.document_id);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());

    const qs = query.toString();

    return await complianceApi.request(
      `/audit-logs${qs ? `?${qs}` : ""}`
    );
  } catch {
  return { total: 0, limit: 10, offset: 0, data: [] };
  }
}

export async function safeGetSignedUrl(documentId: string) {
  try {
    const res = await complianceApi.request(
      `/documents/${documentId}/signed-url`
    );
    console.log("SIGNED URL API RESPONSE:", res);
    return res;
  } catch (err) {
    console.error("SIGNED URL API ERROR:", err);
    return null;
  }
}

export async function safeGetComplianceReport(documentId: string) {
  try {
    return await complianceApi.getComplianceReport(documentId);
  } catch {
    return null;
  }
}

export async function safeGetUsers() {
  try {
    return await complianceApi.request("/users");
  } catch {
    return { users: [] };
  }
}

export async function safeUpdateUser(payload: {
  username: string;
  role?: string;
  enabled?: boolean;
}) {
  try {
    return await complianceApi.request("/users", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

// ============================================================
// AUTHENTICATION HELPERS (Arkhos AI)
// ============================================================

export async function setupPassword(token: string, password: string) {
  try {
    return await complianceApi.request("/auth/setup-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  } catch {
    return null;
  }
}

export async function forgotPassword(username: string) {
  try {
    return await complianceApi.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  } catch {
    return null;
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    return await complianceApi.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  } catch {
    return null;
  }
}