"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetupPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!token) {
      setMessage("Invalid or expired setup link");
      return;
    }

    if (!password.trim()) {
      setMessage("Please enter a password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/setup-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage("Password set successfully. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage(data?.detail || "Failed to set password");
      }
    } catch {
      setMessage("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-[400px] rounded-xl border bg-card p-6 shadow">
        <h1 className="text-xl font-semibold mb-4">Set Your Password</h1>

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full border rounded px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Setting..." : "Set Password"}
        </button>

        {message && (
          <p className="text-sm text-muted-foreground mt-3">{message}</p>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SetupPasswordPage), {
  ssr: false,
});