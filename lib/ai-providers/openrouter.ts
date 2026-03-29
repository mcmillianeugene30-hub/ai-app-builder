export interface AIResponse {
  content: string;
  provider: string;
}

/**
 * OpenRouter (primary provider) using free models.
 * Free models: https://openrouter.ai/models?q=free
 */
export async function generateWithOpenRouter(prompt: string): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free", // free model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty content");

  return { content, provider: "openrouter" };
}
