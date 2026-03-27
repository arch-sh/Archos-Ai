import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeSession, getCurrentUserRole } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("satyam_session");

  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = decodeSession(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Get fresh role from store (in case admin changed it)
  const currentRole = getCurrentUserRole(session.username);
  if (!currentRole) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      username: session.username,
      role: currentRole,
    },
  });
}
