// ============================================================
// SatyamAI – Login API Route
// 🔧 SWAP AUTHENTICATION LOGIC HERE FOR ENTERPRISE SSO
// ============================================================

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Call backend auth service
    const BASE_URL =
      process.env.COMPLIANCE_API_URL || "http://localhost:8003";

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || "Invalid username or password" },
        { status: 401 }
      );
    }

    // Forward backend JWT to frontend
    return NextResponse.json({
      access_token: data.access_token,
      token_type: "bearer",
      user: {
        username: username,
        role: data.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
