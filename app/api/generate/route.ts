import { auth } from "@/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/credits/manager";
import { generateApp } from "@/lib/ai-providers/router";
import { parseGeneratedCode } from "@/lib/code-parser";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Vercel hobby plan max: 60s. Pro plan allows up to 300s.
export const maxDuration = 60;

const GenerateSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(2000),
});

const CREDITS_REQUIRED = parseInt(process.env.CREDITS_PER_GENERATION ?? "5");

export async function POST(req: Request) {
  // Auth + validation happen BEFORE the stream so we can return plain JSON errors
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { prompt: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { prompt } = parsed.data;

  // SSE stream for the generation pipeline
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream may already be closed
        }
      };

      const ping = () => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      };

      let generationId: string | null = null;
      let creditDeducted = false;

      // Keep-alive heartbeat during the long AI call
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      try {
        // Stage 1: Credit check
        send({ type: "progress", stage: "checking", message: "Checking your credit balance…", pct: 8 });
        await checkCredits(userId, CREDITS_REQUIRED);

        // Stage 2: Create DB record
        send({ type: "progress", stage: "preparing", message: "Preparing generation…", pct: 18 });
        const generation = await prisma.generation.create({
          data: { userId, prompt, creditsUsed: CREDITS_REQUIRED, status: "GENERATING" },
        });
        generationId = generation.id;

        // Stage 3: Deduct credits
        send({ type: "progress", stage: "deducting", message: "Reserving credits…", pct: 26 });
        await deductCredits(userId, CREDITS_REQUIRED, `App generation: ${prompt.slice(0, 60)}`);
        creditDeducted = true;

        // Stage 4: AI generation (longest step — 30–90s)
        send({ type: "progress", stage: "generating", message: "Generating your app with AI…", pct: 36 });

        // Heartbeat every 8s during AI call so the connection stays alive
        heartbeatTimer = setInterval(ping, 8000);
        const aiResponse = await generateApp(prompt);
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;

        // Stage 5: Parse files
        send({ type: "progress", stage: "parsing", message: "Parsing generated files…", pct: 84 });
        const { files, error: parseError } = parseGeneratedCode(aiResponse.content);

        // Stage 6: Save to DB
        send({ type: "progress", stage: "saving", message: "Saving your app…", pct: 94 });
        await prisma.generation.update({
          where: { id: generationId },
          data: { status: "COMPLETED", generatedFiles: files, completedAt: new Date() },
        });

        send({ type: "progress", stage: "done", message: "App ready!", pct: 100 });
        send({
          type: "done",
          generationId,
          filesCount: files.length,
          provider: aiResponse.provider,
          ...(parseError && { warning: parseError }),
        });
      } catch (error) {
        if (heartbeatTimer) clearInterval(heartbeatTimer);

        const message = error instanceof Error ? error.message : "Generation failed";
        console.error("[generate/stream] Error:", message);

        if (creditDeducted && generationId) {
          try {
            await refundCredits(userId, CREDITS_REQUIRED, generationId);
          } catch (refundErr) {
            console.error("[generate/stream] Refund failed:", refundErr);
          }
        }

        if (generationId) {
          try {
            await prisma.generation.update({
              where: { id: generationId },
              data: { status: "FAILED", errorMessage: message },
            });
          } catch {}
        }

        const userMessage = message.toLowerCase().includes("insufficient credits")
          ? "Insufficient credits for this generation."
          : creditDeducted
          ? "Generation failed. Your credits have been refunded."
          : message;

        send({ type: "error", message: userMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
