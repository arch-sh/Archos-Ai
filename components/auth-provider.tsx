"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(atob(parts[1]));

    return {
      userId: payload.sub,
      username: payload.sub,
      role: payload.role,
    } as { userId: string; username: string; role: string };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const decoded = decodeJWT(token);

      if (!decoded) {
        setUser(null);
        setLoading(false);
        return;
      }

      const roleMap: Record<string, UserRole> = {
        ADMIN: "Admin",
        ANALYST: "Analyst",
        REVIEWER: "Reviewer",
      };

      const roleKey = (decoded.role || "").toUpperCase();

      setUser({
        id: decoded.userId,
        username: decoded.username,
        role: roleMap[roleKey] ?? "Reviewer",
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (res.ok) {
          localStorage.setItem("access_token", data.access_token);

          const decoded = decodeJWT(data.access_token);

          if (!decoded) {
            return { success: false, error: "Invalid token" };
          }

          const roleMap: Record<string, UserRole> = {
            ADMIN: "Admin",
            ANALYST: "Analyst",
            REVIEWER: "Reviewer",
          };

          const roleKey = (decoded.role || "").toUpperCase();

          setUser({
            id: decoded.userId,
            username: decoded.username,
            role: roleMap[roleKey] ?? "Reviewer",
          });

          router.push("/dashboard");

          return { success: true };
        }

        return {
          success: false,
          error: data?.error || `Login failed (${res.status})`,
        };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem("access_token");
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}