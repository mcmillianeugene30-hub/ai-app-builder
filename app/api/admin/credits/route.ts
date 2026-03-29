import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const AdjustSchema = z.object({
  userId: z.string().min(1),
  delta: z.number().int().refine(n => n !== 0, "Delta must be non-zero"),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = AdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { userId, delta, reason } = parsed.data;

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Atomic adjustment: deduct/add credits + record transaction
  const result = await prisma.$transaction(async tx => {
    // Upsert UserCredits (user might not have a row yet)
    const currentCredits = await tx.userCredits.upsert({
      where: { userId },
      create: { userId, balance: 0 },
      update: {},
    });

    const newBalance = Math.max(0, currentCredits.balance + delta);

    await tx.userCredits.update({
      where: { userId },
      data: { balance: newBalance },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount: delta,
        type: "ADJUSTMENT",
        description: reason ?? `Admin adjustment by ${session.user!.email}`,
        status: "COMPLETED",
      },
    });

    return { newBalance, previousBalance: currentCredits.balance };
  });

  return NextResponse.json({
    success: true,
    previousBalance: result.previousBalance,
    newBalance: result.newBalance,
    delta,
  });
}
