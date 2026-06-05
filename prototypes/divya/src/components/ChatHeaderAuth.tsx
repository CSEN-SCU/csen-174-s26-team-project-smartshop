"use client";

import { useEffect, useState } from "react";

type User = { id: number; email: string };

type ChatHeaderAuthProps = {
  onLogout: () => void;
  onUnauthorized: () => void;
};

/** Compact signed-in strip for the shopping header only — no login/signup UI. */
export function ChatHeaderAuth({ onLogout, onUnauthorized }: ChatHeaderAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) onUnauthorized();
  }, [loading, user, onUnauthorized]);

  async function handleLogout() {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      onLogout();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-xs text-gray-600 truncate max-w-[140px] sm:max-w-[200px]"
        title={user.email}
      >
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={submitting}
        className="shrink-0 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Log out
      </button>
    </div>
  );
}
