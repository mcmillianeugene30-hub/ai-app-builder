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
}

export default function GenerationViewer({ generation }: { generation: Generation }) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(
    generation.files[0] ?? null
  );
  const [downloading, setDownloading] = useState(false);

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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/generations" className="hover:underline">Generations</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium truncate max-w-sm">{generation.prompt}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{generation.files.length} files · {generation.creditsUsed} credits</span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? "Zipping..." : "⬇ Download ZIP"}
          </button>
          <Link href="/generate" className="text-sm border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 font-medium">
            + New App
          </Link>
        </div>
      </div>

      {/* Editor layout */}
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
