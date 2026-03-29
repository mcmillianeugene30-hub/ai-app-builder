import type { GeneratedFile } from "./code-parser";

/**
 * Generate a ZIP file from an array of files.
 * Works in both browser (client) and Node.js (server) environments.
 * Uses JSZip for client-side, returns a Blob.
 */
export async function generateZipBlob(files: GeneratedFile[], appName: string): Promise<Blob> {
  // Dynamic import so it only loads client-side
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const folder = zip.folder(sanitizeFolderName(appName));
  if (!folder) throw new Error("Could not create ZIP folder");

  for (const file of files) {
    // Ensure clean paths (no leading slashes)
    const cleanPath = file.path.replace(/^\/+/, "");
    folder.file(cleanPath, file.content);
  }

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

/**
 * Trigger a browser download of a ZIP blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "generated-app";
}
