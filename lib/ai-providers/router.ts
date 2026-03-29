import { generateWithOpenRouter, type AIResponse } from "./openrouter";
import { generateWithGemini } from "./gemini";
import { generateWithGroq } from "./groq";

export type { AIResponse };

const GENERATION_META_PROMPT = `You are an expert full-stack developer. Generate a complete working app based on the user request below.

Requirements:
- Use React + Vite for frontend, Express.js for backend, SQLite (better-sqlite3) for data persistence
- All dependencies must be free and open source
- Generate code as separate files with clear file paths
- Include a README.md with setup instructions (npm install + npm run dev)
- Output MUST be valid JSON only, no markdown, no explanation before or after the JSON
- JSON format: { "files": [ { "path": "relative/path/file.ext", "content": "file content here" } ] }
- The app must be fully functional without any additional coding
- Use Tailwind CSS for styling (include tailwind setup)
- Include package.json files for both frontend and backend
- If payment integration is requested, use Stripe test mode
- If user authentication is requested, use JWT

User request: `;

/**
 * Route AI generation requests through providers with automatic fallback.
 * Order: OpenRouter → Gemini → Groq
 */
export async function generateApp(userPrompt: string, modelId?: string): Promise<AIResponse> {
  const fullPrompt = GENERATION_META_PROMPT + userPrompt;
  
  if (modelId === "gemini") {
    return generateWithGemini(fullPrompt);
  } else if (modelId === "groq") {
    return generateWithGroq(fullPrompt);
  } else if (modelId === "openrouter") {
    return generateWithOpenRouter(fullPrompt);
  }

  // Default fallback chain
  const providers = [
    { name: "OpenRouter", fn: () => generateWithOpenRouter(fullPrompt) },
    { name: "Gemini", fn: () => generateWithGemini(fullPrompt) },
    { name: "Groq", fn: () => generateWithGroq(fullPrompt) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[AI Router] Trying ${provider.name}...`);
      const result = await provider.fn();
      console.log(`[AI Router] Success with ${provider.name}`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AI Router] ${provider.name} failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}
