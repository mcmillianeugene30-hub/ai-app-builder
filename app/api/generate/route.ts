import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/credits/manager";
import { generateApp } from "@/lib/ai-providers/router";
import { parseGeneratedCode } from "@/lib/code-parser";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const GenerateSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(2000),
});

const CREDITS_REQUIRED = parseInt(process.env.CREDITS_PER_GENERATION ?? "5");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Validate request body
  let body: { prompt: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { prompt } = parsed.data;

  // 1. Check credits
  try {
    await checkCredits(userId, CREDITS_REQUIRED);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insufficient credits" },
      { status: 402 }
    );
  }

  // 2. Create generation record (PENDING)
  const generation = await prisma.generation.create({
    data: {
      userId,
      prompt,
      creditsUsed: CREDITS_REQUIRED,
      status: "GENERATING",
    },
  });

  // 3. Deduct credits immediately (refund on failure)
  try {
    await deductCredits(userId, CREDITS_REQUIRED, `App generation: ${prompt.slice(0, 60)}`);
  } catch (err) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", errorMessage: "Credit deduction failed" },
    });
    return NextResponse.json({ error: "Credit deduction failed" }, { status: 500 });
  }

  // 4. Generate with AI
  try {
    const aiResponse = await generateApp(prompt);
    const { files, error: parseError } = parseGeneratedCode(aiResponse.content);

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        generatedFiles: files,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      generationId: generation.id,
      filesCount: files.length,
      provider: aiResponse.provider,
      parseWarning: parseError,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Generation failed";
    console.error("[generate] AI generation failed:", errorMessage);

    // Refund credits
    try {
      await refundCredits(userId, CREDITS_REQUIRED, generation.id);
    } catch (refundErr) {
      console.error("[generate] Refund failed:", refundErr);
    }

    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED", errorMessage },
    });

    return NextResponse.json(
      { error: "Generation failed. Your credits have been refunded." },
      { status: 500 }
    );
  }
}
