export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ParseResult {
  files: GeneratedFile[];
  error?: string;
}

/**
 * Parse AI output into structured file objects.
 * Handles JSON output and falls back to markdown extraction.
 */
export function parseGeneratedCode(aiOutput: string): ParseResult {
  // Strategy 1: Direct JSON parse
  const jsonMatch = aiOutput.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.files) && parsed.files.length > 0) {
        const files = parsed.files.filter(
          (f: unknown) =>
            typeof f === "object" &&
            f !== null &&
            "path" in f &&
            "content" in f &&
            typeof (f as GeneratedFile).path === "string" &&
            typeof (f as GeneratedFile).content === "string"
        );
        if (files.length > 0) {
          return { files };
        }
      }
    } catch {
      // fall through to next strategy
    }
  }

  // Strategy 2: Extract markdown code blocks with file path comments
  const files: GeneratedFile[] = [];
  const blockRegex = /```(?:\w+)?\s*\n(?:\/\/\s*|#\s*|<!--\s*)?([^\n]+?)(?:\s*-->)?\n([\s\S]*?)```/g;
  let match;

  while ((match = blockRegex.exec(aiOutput)) !== null) {
    const possiblePath = match[1].trim();
    const content = match[2];

    // Filter: looks like a file path
    if (possiblePath.includes(".") || possiblePath.includes("/")) {
      files.push({ path: possiblePath, content });
    }
  }

  if (files.length > 0) {
    return { files };
  }

  // Strategy 3: Single file fallback — treat entire output as code
  return {
    files: [{ path: "output.txt", content: aiOutput }],
    error: "Could not parse structured output; raw content returned.",
  };
}

/**
 * Detect programming language from file extension for Monaco Editor.
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
    sh: "shell",
    sql: "sql",
    prisma: "prisma",
    env: "plaintext",
    txt: "plaintext",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext ?? ""] ?? "plaintext";
}
