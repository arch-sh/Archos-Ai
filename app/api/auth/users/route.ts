// ============================================================
// SatyamAI – User Management API
// 🔧 This file controls user roles and access
// ============================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decodeSession,
  getAllUsers,
  updateUserRole,
  setUserEnabled,
  getCurrentUserRole,
} from "@/lib/auth";
import type { UserRole } from "@/lib/types";

async function requireAdmin(): Promise<{ authorized: boolean; error?: NextResponse }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("satyam_session");
  if (!sessionCookie) {
    return { authorized: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const session = decodeSession(sessionCookie.value);
  if (!session) {
    return { authorized: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = getCurrentUserRole(session.username);
  if (role !== "Admin") {
    return { authorized: false, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { authorized: true };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  const users = getAllUsers();
  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error!;

  const body = await request.json();
  const { username, role, enabled } = body;

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  let updatedUser = null;

  if (role) {
    const validRoles: UserRole[] = ["Admin", "Analyst", "Reviewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updatedUser = updateUserRole(username, role);
  }

  if (typeof enabled === "boolean") {
    updatedUser = setUserEnabled(username, enabled);
  }

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updatedUser });
}
