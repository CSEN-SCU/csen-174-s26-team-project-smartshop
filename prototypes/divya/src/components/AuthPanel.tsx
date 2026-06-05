"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: number; email: string };

/** Full account card for the home page only (login / signup / logout). */
export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setUser(data.user);
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError("");
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      setEmail("");
      setPassword("");
    } catch {
      setError("Logout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 text-center">Checking session…</p>;
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-gray-700">
          Signed in as <strong className="text-green-800">{user.email}</strong>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Log out
        </button>
      </div>
    );
  }

  // In compact (header) mode, don't show the login form — just a quiet hint
  if (compact) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex gap-2 mb-3 justify-center">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`text-sm px-3 py-1 rounded-lg ${mode === "login" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`text-sm px-3 py-1 rounded-lg ${mode === "signup" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          Sign up
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
        >
          {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2 text-center">⚠️ {error}</p>}
    </div>
  );
}
