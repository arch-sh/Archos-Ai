// ============================================================
// SatyamAI – Authentication & Authorization Library
// 🔧 This file controls all auth logic. Swap with enterprise SSO here.
// ============================================================

import type { User, UserRole, SessionPayload } from "./types";

// ============================================================
// In-memory user store (replace with database in production)
// 🔧 SWAP THIS WITH YOUR DATABASE / SSO PROVIDER
// ============================================================

const USERS_STORE: Map<string, User & { password: string }> = new Map([
  [
    "admin",
    {
      id: "usr_001",
      username: "admin",
      password: "admin", // 🔧 In production, use hashed passwords with bcrypt
      role: "Admin" as UserRole,
      enabled: true,
      createdAt: "2024-01-01T00:00:00Z",
      lastLogin: null,
    },
  ],
  [
    "analyst",
    {
      id: "usr_002",
      username: "analyst",
      password: "analyst",
      role: "Analyst" as UserRole,
      enabled: true,
      createdAt: "2024-01-15T00:00:00Z",
      lastLogin: null,
    },
  ],
]);

// Simple counter for new user IDs
let userIdCounter = 3;

/**
 * Authenticate user credentials
 * 🔧 Replace with SSO / OAuth / SAML integration
 */
export function authenticateUser(
  username: string,
  password: string
): User | null {
  const existingUser = USERS_STORE.get(username);

  if (existingUser) {
    if (existingUser.password !== password) return null;
    if (!existingUser.enabled) return null;
    existingUser.lastLogin = new Date().toISOString();
    const { password: _, ...user } = existingUser;
    return user;
  }

  // Auto-register new users as Reviewer
  const newUser: User & { password: string } = {
    id: `usr_${String(userIdCounter++).padStart(3, "0")}`,
    username,
    password,
    role: "Reviewer",
    enabled: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  USERS_STORE.set(username, newUser);
  const { password: _, ...user } = newUser;
  return user;
}

/**
 * Get all users (admin function)
 */
export function getAllUsers(): User[] {
  return Array.from(USERS_STORE.values()).map(
    ({ password: _, ...user }) => user
  );
}

/**
 * Update user role
 */
export function updateUserRole(
  username: string,
  newRole: UserRole
): User | null {
  const user = USERS_STORE.get(username);
  if (!user) return null;
  user.role = newRole;
  const { password: _, ...u } = user;
  return u;
}

/**
 * Enable/disable user
 */
export function setUserEnabled(
  username: string,
  enabled: boolean
): User | null {
  const user = USERS_STORE.get(username);
  if (!user) return null;
  user.enabled = enabled;
  const { password: _, ...u } = user;
  return u;
}

/**
 * Create session payload
 * 🔧 Replace with JWT / encrypted session in production
 */
export function createSessionPayload(user: User): SessionPayload {
  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
}

/**
 * Encode session to base64 string (cookie value)
 * 🔧 In production, use encrypted JWT or signed cookies
 */
export function encodeSession(payload: SessionPayload): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Decode session from cookie value
 */
export function decodeSession(encoded: string): SessionPayload | null {
  try {
    const payload = JSON.parse(atob(encoded)) as SessionPayload;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get the currently stored user role (fresh from store)
 */
export function getCurrentUserRole(username: string): UserRole | null {
  const user = USERS_STORE.get(username);
  if (!user || !user.enabled) return null;
  return user.role;
}

// ============================================================
// Role-based access control helpers
// ============================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  Admin: 3,
  Analyst: 2,
  Reviewer: 1,
};

export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Route access configuration
 * 🔧 Add new routes and their required roles here
 */
export const ROUTE_ACCESS: Record<string, UserRole> = {
  "/dashboard": "Reviewer",
  "/documents": "Reviewer",
  "/audit-logs": "Analyst",
  "/users": "Admin",
  "/settings": "Admin",
};
