import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/api/auth/login"];

export function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // ✅ Allow public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // ✅ Allow all API routes (since auth is client-side)
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // ✅ Allow everything else (NO BLOCKING)
    return NextResponse.next();

  } catch (error) {
    console.error("Proxy error:", error);

    // 🚨 NEVER break request
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};