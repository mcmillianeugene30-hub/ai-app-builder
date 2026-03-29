"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const EXAMPLES = [
  "A task manager with drag-and-drop, priorities, and due dates",
  "A personal finance tracker with monthly budget charts",
  "A recipe book with search, categories, and ingredient lists",
  "A team kanban board with columns and card assignments",
  "A markdown blog with syntax highlighting and tags",
];

const CREDITS_PER_GEN = 5;

const STAGES = ["Analyzing", "Generating", "Parsing", "Saving"] as const;
const STAGE_THRESHOLDS = [0, 36, 84, 94]; // pct values where each stage begins

// useSearchParams() requires a Suspense boundary in Next.js 15
export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateForm />
    </Suspense>
  );
}

function GenerateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState(searchParams.get("prompt") ?? "");
  const [modelId, setModelId] = useState("default");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ message: string; pct: number } | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0));
  }, []);

  // Pre-fill from URL param when it changes (template navigation)
  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) setPrompt(p);
  }, [searchParams]);

  const canGenerate = balance !== null && balance >= CREDITS_PER_GEN && prompt.trim().length > 10;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate || loading) return;

    setLoading(true);
    setError("");
    setProgress({ message: "Starting…", pct: 0 });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), modelId: modelId === "default" ? undefined : modelId }),
      });

      // Non-streaming errors (auth, validation)
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Generation failed. Please try again.");
        setLoading(false);
        setProgress(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              setProgress({ message: event.message, pct: event.pct });
            } else if (event.type === "done") {
              router.push(`/generations/${event.generationId}`);
              return;
            } else if (event.type === "error") {
              setError(event.message);
              setLoading(false);
              setProgress(null);
              return;
            }
          } catch {
            // Ignore malformed SSE lines (e.g. keep-alive pings)
          }
        }
      }
    } catch {
      setError("Connection lost. Please try again.");
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Build an App</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Describe what you want — we&apos;ll generate the complete source code
        </p>
      </div>

      {/* Credit balance */}
      <div
        className={`card p-4 flex items-center justify-between ${
          balance !== null && balance < CREDITS_PER_GEN ? "border-red-200 bg-red-50" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          <span>🎫</span>
          <span className="font-medium">{balance ?? "—"} credits</span>
          <span className="text-gray-400">available</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Cost: <strong>{CREDITS_PER_GEN} credits</strong>
          </span>
          {balance !== null && balance < CREDITS_PER_GEN && (
            <Link
              href="/credits"
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              Buy Credits
            </Link>
          )}
        </div>
      </div>

      {/* Active progress state */}
      {loading && progress && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl animate-bounce">🤖</div>
            <div>
              <div className="font-medium text-sm">{progress.message}</div>
              <div className="text-xs text-gray-400 mt-0.5">{progress.pct}% complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress.pct}%` }}
            />
          </div>

          {/* Stage breadcrumbs */}
          <div className="flex items-center gap-1 text-xs">
            {STAGES.map((stage, i) => {
              const started = progress.pct >= STAGE_THRESHOLDS[i];
              const finished = i < STAGES.length - 1 && progress.pct >= STAGE_THRESHOLDS[i + 1];
              const active = started && !finished;
              return (
                <span key={stage} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 mx-1">›</span>}
                  <span
                    className={
                      finished
                        ? "text-green-600 font-medium"
                        : active
                        ? "text-blue-600 font-semibold"
                        : "text-gray-300"
                    }
                  >
                    {finished && "✓ "}{stage}
                  </span>
                </span>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 text-center">
            This usually takes 30–60 seconds — hang tight
          </p>
        </div>
      )}

      {/* Prompt form (hidden while loading) */}
      {!loading && (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 px-1">AI Model</label>
            <div className="flex gap-2">
              {[
                { id: "default", label: "Auto (Fastest)", icon: "✨" },
                { id: "openrouter", label: "Llama 3.1", icon: "🦙" },
                { id: "gemini", label: "Gemini 1.5", icon: "♊" },
                { id: "groq", label: "Mixtral", icon: "🌪️" },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelId(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    modelId === m.id
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-1">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe your app in detail…&#10;&#10;Example: A task manager with drag-and-drop reordering, priority levels (high/medium/low), due dates with reminders, and dark mode support."
              className="w-full p-4 text-sm resize-none focus:outline-none rounded-xl h-48 placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span className="text-xs text-gray-400">{prompt.length} / 2000 chars</span>
              <button
                type="submit"
                disabled={!canGenerate}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ⚡ Generate App
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
          {error.toLowerCase().includes("credit") && (
            <Link href="/credits" className="ml-2 underline font-medium">
              Buy more →
            </Link>
          )}
        </div>
      )}

      {/* Examples + template link */}
      {!loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Quick examples
            </p>
            <Link href="/templates" className="text-xs text-blue-500 hover:underline">
              Browse all templates →
            </Link>
          </div>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="w-full text-left text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 hover:border-blue-300 transition-colors"
            >
              <span className="text-blue-400 mr-2">›</span>
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
