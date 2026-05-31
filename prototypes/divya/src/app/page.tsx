"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { DIETARY_OPTIONS } from "@/lib/dietary";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "eggs, milk, and chicken breast — cheapest near me",
  "where should I buy rice and pasta?",
  "I need bread and bananas on a budget",
  "compare prices for yogurt across stores",
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [showDietary, setShowDietary] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function toggleRestriction(id: string) {
    setRestrictions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, restrictions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetChat() {
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    setMessages([]);
    setError("");
  }

  if (!started) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div>
            <div className="text-5xl mb-4">🛒</div>
            <h1 className="text-4xl font-bold text-green-700">SmartShop</h1>
            <p className="text-xl text-gray-600 mt-2">Find the best grocery deals near you</p>
            <p className="text-sm mt-3">
              <Link
                href="/similar-alternatives"
                className="text-green-600 hover:text-green-800 font-medium underline underline-offset-2"
              >
                Find similar alternatives to one product →
              </Link>
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left space-y-4">
            <h2 className="font-semibold text-lg text-gray-800">What is SmartShop?</h2>
            <p className="text-gray-600">
              SmartShop is a conversational grocery price assistant for budget-conscious shoppers.
              Tell it what you need to buy, and it instantly compares prices across nearby stores —
              factoring in both <strong>cost</strong> and <strong>distance</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { icon: "💬", label: "Just type what you need", desc: "Natural language — no forms to fill" },
                { icon: "📍", label: "Price + distance", desc: "We factor in the trip, not just the tag" },
                { icon: "💰", label: "Best overall deal", desc: "Powered by AI to match items across stores" },
              ].map(f => (
                <div key={f.label} className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-sm font-medium text-green-800">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold px-10 py-4 rounded-2xl shadow transition-colors w-full sm:w-auto"
          >
            Start Shopping →
          </button>
          <p className="text-xs text-gray-400">Prototype for CSEN 174 · Spring 2026 · Divya Bengali</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="font-bold text-green-700 text-lg">SmartShop</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <Link
            href="/similar-alternatives"
            className="text-sm text-green-600 hover:text-green-800 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
          >
            Similar alt.
          </Link>
          <button onClick={resetChat} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">New chat</button>
          <button onClick={() => { resetChat(); setStarted(false); }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors">Home</button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-700"><span className="text-base mr-2">🛒</span>👋 Hi! I'm SmartShop. Before we start, <strong>do you have any dietary restrictions?</strong> Select any that apply and I'll make sure I only suggest items that are safe for you.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => {
                  const active = restrictions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleRestriction(opt.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {active ? "✓ " : ""}{opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-600 mt-3 text-sm">
                {restrictions.length > 0
                  ? `Got it — I'll keep your restrictions in mind. Now tell me what groceries you're looking for!`
                  : `No restrictions? No problem — just tell me what groceries you're looking for and I'll compare prices across 5 local stores.`}
              </p>
            </div>
            <p className="text-sm text-gray-400 text-center">Try one of these:</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="text-left bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors shadow-sm">"{s}"</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === "user" ? "bg-green-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"}`}>
              {m.role === "assistant" && <span className="text-base mr-2">🛒</span>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="text-base mr-1">🛒</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowDietary(s => !s)}
            className="text-xs font-medium text-gray-600 hover:text-green-700 flex items-center gap-1"
          >
            🥗 Dietary restrictions
            {restrictions.length > 0 && (
              <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                {restrictions.length}
              </span>
            )}
            <span className="text-gray-400">{showDietary ? "▲" : "▼"}</span>
          </button>
          {showDietary && (
            <div className="mt-2 flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => {
                const active = restrictions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleRestriction(opt.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {active ? "✓ " : ""}{opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. eggs, milk, chicken breast..." className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl px-5 py-3 font-semibold text-sm transition-colors">Send</button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">Comparing prices at Trader Joe's, Safeway, Whole Foods, Target, and Costco</p>
      </div>
    </main>
  );
}
