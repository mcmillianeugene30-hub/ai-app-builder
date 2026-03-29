import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gen = await prisma.generation.findUnique({
    where: { id },
    select: { prompt: true },
  });
  if (!gen) return { title: "App Not Found" };
  const short = gen.prompt.length > 60 ? gen.prompt.slice(0, 60) + "…" : gen.prompt;
  return {
    title: `${short} — AppBuilder`,
    description: "Generated with AppBuilder — describe it, generate it, ship it.",
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder";

  const generation = await prisma.generation.findUnique({
    where: { id },
    select: {
      id: true,
      prompt: true,
      status: true,
      modelId: true,
      creditsUsed: true,
      createdAt: true,
      generatedFiles: true,
    },
  });

  if (!generation || generation.status !== "COMPLETED") notFound();

  const files = Array.isArray(generation.generatedFiles)
    ? (generation.generatedFiles as Array<{ path: string; content: string }>)
    : [];

  // Build directory tree for display
  const dirs = new Map<string, string[]>();
  files.forEach(f => {
    const parts = f.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
    const existing = dirs.get(dir) ?? [];
    existing.push(f.path);
    dirs.set(dir, existing);
  });

  const sortedDirs = Array.from(dirs.entries()).sort(([a], [b]) => a.localeCompare(b));

  function extIcon(path: string) {
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "⚛️";
    if (path.endsWith(".ts") || path.endsWith(".js")) return "📜";
    if (path.endsWith(".css")) return "🎨";
    if (path.endsWith(".json")) return "🔧";
    if (path.endsWith(".md")) return "📖";
    if (path.endsWith(".html")) return "🌐";
    if (path.endsWith(".prisma")) return "🗄️";
    if (path.endsWith(".env") || path.endsWith(".example")) return "🔑";
    return "📄";
  }

  const generatedAt = new Date(generation.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-blue-600 text-lg">
            ⚡ {APP_NAME}
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Build Your Own →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  ✅ Generated
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {files.length} files
                </span>
                {generation.modelId && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    🤖 {generation.modelId}
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {generation.creditsUsed} credits
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {generatedAt}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">
                &ldquo;{generation.prompt}&rdquo;
              </h1>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm text-gray-700 text-left">App Preview</h2>
              <p className="text-xs text-gray-400 mt-0.5 text-left">Interactive simulation of the generated UI</p>
            </div>
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Simulation</span>
          </div>
          <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
             <div className="max-w-md space-y-4">
                <div className="text-4xl">🌐</div>
                <h3 className="text-lg font-bold text-gray-800">{generation.prompt.slice(0, 50)}...</h3>
                <p className="text-sm text-gray-500">
                  This is a live simulation of the generated React + Vite frontend. 
                  In a production environment, this would be a sandbox running the actual code.
                </p>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-left space-y-2">
                   <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                   <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                   <div className="h-2 w-3/4 bg-gray-100 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* File tree */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-sm text-gray-700">Generated Files</h2>
              <p className="text-xs text-gray-400 mt-0.5">{files.length} files total</p>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {sortedDirs.map(([dir, paths]) => (
                <div key={dir}>
                  {dir && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 pl-1">
                      📁 {dir}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {paths.map(path => {
                      const filename = path.split("/").pop() ?? path;
                      return (
                        <div
                          key={path}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <span className="text-sm">{extIcon(path)}</span>
                          <span className="truncate">{filename}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Build similar CTA */}
            <div className="bg-blue-600 rounded-2xl p-8 text-white">
              <div className="text-3xl mb-3">⚡</div>
              <h2 className="text-xl font-bold mb-2">Build something like this</h2>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Describe your app idea in plain English. Get complete source code — React frontend,
                Express backend, SQLite database — ready to run in under 2 minutes.
              </p>
              <Link
                href={`/generate?prompt=${encodeURIComponent(generation.prompt)}`}
                className="inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Use This Prompt →
              </Link>
            </div>

            {/* What you get */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-gray-800">What you get</h3>
              <div className="space-y-3">
                {[
                  ["⚛️", "React + Vite frontend", "Responsive UI with Tailwind CSS"],
                  ["🖥️", "Express.js backend", "REST API, SQLite database, full CRUD"],
                  ["📦", "Download as ZIP", "All files, ready to npm install & run"],
                  ["♾️", "Yours to keep", "No license, no lock-in, full source code"],
                ].map(([icon, title, sub]) => (
                  <div key={title as string} className="flex items-start gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{title}</div>
                      <div className="text-xs text-gray-500">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing hint */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-1">
                5 credits per app · packages from{" "}
                <strong className="text-gray-900">$10 for 100 credits</strong>
              </p>
              <p className="text-xs text-gray-400">Credits never expire · Powered by Stripe</p>
              <Link
                href="/signup"
                className="inline-block mt-4 text-sm bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Create Account & Buy Credits →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
