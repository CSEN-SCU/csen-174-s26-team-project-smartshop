"use client";

import Link from "next/link";
import { useState } from "react";

type Alt = { name: string; whySimilar: string };

type ApiOk = {
  item: string;
  alternatives: Alt[];
  source: "openai" | "fallback";
  disclaimer: string;
};

export default function SimilarAlternativesPage() {
  const [item, setItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ApiOk | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = item.trim();
    if (!q || loading) return;
    setError("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/similar-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: q }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Request failed");
      setData(payload as ApiOk);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-xl mx-auto px-4 py-10 pb-24">
      <nav className="flex gap-4 text-sm font-medium text-gray-600 mb-8">
        <Link href="/" className="hover:text-green-700">
          ← Chat & prices
        </Link>
        <span className="text-green-700">Similar alternatives</span>
      </nav>

      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🔁</div>
        <h1 className="text-2xl font-bold text-green-700">Similar alternatives</h1>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          Enter one product. SmartShop sends <strong>one OpenAI</strong> request and lists close substitutes—not live
          prices or inventory.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <label htmlFor="item" className="block text-sm font-medium text-gray-700">
          Product
        </label>
        <input
          id="item"
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="e.g. Greek yogurt, olive oil, paper towels…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !item.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl py-3 font-semibold text-sm transition-colors"
        >
          {loading ? "Calling OpenAI…" : "Find similar alternatives"}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">⚠️ {error}</div>
      )}

      {data && (
        <div className="mt-8 space-y-4">
          {data.disclaimer && (
            <p className="text-xs text-gray-500 leading-relaxed border border-amber-100 bg-amber-50 rounded-xl px-3 py-2">
              {data.disclaimer}
            </p>
          )}
          {data.source === "fallback" && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Offline fallback (add <code className="font-mono">OPENAI_API_KEY</code> to <code className="font-mono">.env.local</code> for live OpenAI).
            </p>
          )}
          <ul className="space-y-3">
            {data.alternatives.map((alt) => (
              <li key={alt.name} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-sm">
                <p className="font-semibold text-gray-900">{alt.name}</p>
                <p className="text-gray-600 mt-2">{alt.whySimilar || "—"}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-12">SmartShop prototype · CSEN 174</p>
    </main>
  );
}
