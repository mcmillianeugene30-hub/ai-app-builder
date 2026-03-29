"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EXAMPLES = [
  "A task manager with drag-and-drop, priorities, and due dates",
  "A personal finance tracker with monthly budget charts",
  "A recipe book with search, categories, and ingredient lists",
  "A team kanban board with columns and card assignments",
  "A markdown blog with syntax highlighting and tags",
];

const CREDITS_PER_GEN = 5;

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/credits/balance")
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0));
  }, []);

  const canGenerate = balance !== null && balance >= CREDITS_PER_GEN && prompt.trim().length > 10;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        setLoading(false);
        return;
      }

      router.push(`/generations/${data.generationId}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Build an App</h1>
        <p className="text-gray-500 text-sm mt-0.5">Describe what you want — we&apos;ll generate the complete source code</p>
      </div>

      {/* Credit status */}
      <div className={`card p-4 flex items-center justify-between ${balance !== null && balance < CREDITS_PER_GEN ? "border-red-200 bg-red-50" : ""}`}>
        <div className="flex items-center gap-2 text-sm">
          <span>🎫</span>
          <span className="font-medium">{balance ?? "—"} credits</span>
          <span className="text-gray-400">available</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Cost: <strong>{CREDITS_PER_GEN} credits</strong></span>
          {balance !== null && balance < CREDITS_PER_GEN && (
            <Link href="/credits" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
              Buy Credits
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="card p-1">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your app in detail...&#10;&#10;Example: A task manager with drag-and-drop reordering, priority levels (high/medium/low), due dates with reminders, and dark mode support."
            className="w-full p-4 text-sm resize-none focus:outline-none rounded-xl h-48 placeholder:text-gray-400"
            disabled={loading}
          />
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <span className="text-xs text-gray-400">{prompt.length} chars · min 10</span>
            <button
              type="submit"
              disabled={!canGenerate || loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>⚡ Generate App</>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
          {error.includes("credits") && (
            <Link href="/credits" className="ml-2 underline font-medium">Buy more →</Link>
          )}
        </div>
      )}

      {loading && (
        <div className="card p-6 text-center">
          <div className="text-2xl mb-3 animate-bounce">🤖</div>
          <div className="font-medium mb-1">Building your app...</div>
          <div className="text-sm text-gray-400">This usually takes 30–90 seconds</div>
          <div className="mt-4 flex justify-center gap-1">
            {["Analyzing prompt", "Writing code", "Packaging files"].map((step, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-gray-400">
                {i > 0 && <span>·</span>}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example prompts */}
      {!loading && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Try these examples</p>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="w-full text-left text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 hover:border-blue-300 transition-colors"
            >
              <span className="text-blue-400 mr-2">›</span>{ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
