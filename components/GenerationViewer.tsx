"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getLanguageFromPath, type GeneratedFile } from "@/lib/code-parser";
import { generateZipBlob, downloadBlob } from "@/lib/zip-generator";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Generation {
  id: string;
  prompt: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
  errorMessage?: string | null;
  files: GeneratedFile[];
  customDomain?: string | null;
}

export default function GenerationViewer({ generation }: { generation: Generation }) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(
    generation.files[0] ?? null
  );
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "settings">("code");
  const [customDomain, setCustomDomain] = useState(generation.customDomain ?? "");

  async function handleShare() {
    const url = `${window.location.origin}/share/${generation.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await generateZipBlob(generation.files, generation.prompt.slice(0, 30));
      downloadBlob(blob, `generated-app-${generation.id.slice(0, 8)}.zip`);
    } catch (e) {
      alert("Download failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setDownloading(false);
    }
  }

  if (generation.status === "FAILED") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/generations" className="hover:underline">Generations</Link>
          <span>›</span>
          <span>Failed Generation</span>
        </div>
        <div className="card p-8 text-center border-red-200">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Generation Failed</h2>
          <p className="text-gray-500 text-sm mb-2">{generation.errorMessage ?? "An error occurred during generation."}</p>
          <p className="text-green-600 text-sm mb-6">Your credits were automatically refunded.</p>
          <Link href="/generate" className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (generation.status === "GENERATING" || generation.status === "PENDING") {
    return (
      <div className="card p-16 text-center">
        <div className="text-4xl mb-3 animate-bounce">⚙️</div>
        <h2 className="text-xl font-bold mb-2">Generating your app...</h2>
        <p className="text-gray-500 text-sm">Refresh in a moment to see results</p>
      </div>
    );
  }

  // Build file tree (grouped by directory)
  const directories: Record<string, GeneratedFile[]> = {};
  generation.files.forEach(file => {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    if (!directories[dir]) directories[dir] = [];
    directories[dir].push(file);
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
          <Link href="/generations" className="hover:underline shrink-0">Generations</Link>
          <span className="shrink-0">›</span>
          <span className="text-gray-800 font-medium truncate max-w-sm">{generation.prompt}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">{generation.files.length} files · {generation.creditsUsed} credits</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 border border-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {copied ? "✓ Copied!" : "🔗 Share"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {downloading ? "Zipping..." : "⬇ Download ZIP"}
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("code")}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "code" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          💻 Code View
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "preview" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          👁️ App Preview
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "settings" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {activeTab === "code" ? (
        <div className="card overflow-hidden flex h-[75vh]">
          {/* File tree */}
          <div className="w-60 border-r border-gray-100 overflow-y-auto bg-gray-50 flex-shrink-0">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              Files
            </div>
            {Object.entries(directories).sort().map(([dir, files]) => (
              <div key={dir}>
                {dir !== "." && (
                  <div className="px-3 py-1.5 text-xs text-gray-400 font-medium bg-gray-100 border-b border-gray-100">
                    📁 {dir}
                  </div>
                )}
                {files.map(file => {
                  const name = file.path.split("/").pop()!;
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                        isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="opacity-50">{getFileIcon(name)}</span>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Monaco editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedFile ? (
              <>
                <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 bg-white flex items-center gap-2">
                  <span className="text-gray-400">{getFileIcon(selectedFile.path.split("/").pop()!)}</span>
                  <span className="font-medium text-gray-700">{selectedFile.path}</span>
                </div>
                <div className="flex-1">
                  <MonacoEditor
                    height="100%"
                    language={getLanguageFromPath(selectedFile.path)}
                    value={selectedFile.content}
                    theme="vs-light"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      folding: true,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a file to view
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "preview" ? (
        <div className="card h-[75vh] bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <div className="text-6xl animate-pulse">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800">App Preview</h2>
            <p className="text-gray-500">
              Interactive preview is being initialized...
              Your app description: <br/>
              <span className="italic font-medium text-gray-700">"{generation.prompt.slice(0, 100)}..."</span>
            </p>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left space-y-4 w-full">
               <div className="flex items-center gap-2">
                 <div className="h-3 w-32 bg-gray-200 rounded-full"></div>
                 <div className="h-3 w-8 bg-blue-100 rounded-full ml-auto"></div>
               </div>
               <div className="space-y-2">
                 <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                 <div className="h-2 w-5/6 bg-gray-100 rounded-full"></div>
                 <div className="h-2 w-4/6 bg-gray-100 rounded-full"></div>
               </div>
               <div className="h-10 w-full bg-blue-600 rounded-xl"></div>
            </div>
            <p className="text-xs text-gray-400">
              This preview simulates how your generated app would look once deployed.
              The full React + Vite + Express stack is available in the "Download ZIP" option.
            </p>
          </div>
        </div>
      ) : (
        <div className="card h-[75vh] p-8 space-y-8 overflow-y-auto">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Project Settings</h3>
            <p className="text-sm text-gray-500 mb-6">Manage your project configuration and deployment options</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Custom Domain</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="app.yourdomain.com"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                    Connect
                  </button>
                </div>
                <p className="text-xs text-gray-400">Point your CNAME record to <code className="bg-gray-100 px-1 rounded">deploy.appbuilder.com</code></p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <label className="text-sm font-semibold text-gray-700">Collaborators</label>
                <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">YO</div>
                        <div className="text-sm font-medium">You (Owner)</div>
                      </div>
                      <span className="text-xs text-gray-400">Full Access</span>
                   </div>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:underline">+ Invite Collaborator</button>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                 <label className="text-sm font-semibold text-gray-700 text-red-600">Danger Zone</label>
                 <button className="w-full text-left border border-red-200 text-red-600 p-4 rounded-xl text-sm hover:bg-red-50 transition-colors">
                    <span className="font-bold">Delete Project</span>
                    <p className="text-xs text-red-500 mt-0.5">This will permanently delete the generation and all associated files.</p>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const icons: Record<string, string> = {
    tsx: "⚛", ts: "📘", js: "📜", jsx: "⚛", json: "📋",
    css: "🎨", html: "🌐", md: "📄", prisma: "🗄", env: "🔑",
    sh: "⚙", sql: "🗃", yaml: "⚙", yml: "⚙",
  };
  return icons[ext ?? ""] ?? "📄";
}
