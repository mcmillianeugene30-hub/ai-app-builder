import { prisma } from "@/lib/db/prisma";
import { TransactionType, TransactionStatus } from "@prisma/client";

/**
 * Get a user's current credit balance.
 * Creates a credits record if it doesn't exist.
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const credits = await prisma.userCredits.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  });
  return credits.balance;
}

/**
 * Check if user has enough credits. Throws if not.
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number
): Promise<void> {
  const balance = await getCreditBalance(userId);
  if (balance < requiredCredits) {
    throw new Error(
      `Insufficient credits. You need ${requiredCredits} credits but only have ${balance}.`
    );
  }
}

/**
 * Deduct credits from a user's balance and log a transaction.
 * Returns the transaction record.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string
) {
  return await prisma.$transaction(async (tx) => {
    const credits = await tx.userCredits.findUnique({ where: { userId } });
    if (!credits || credits.balance < amount) {
      throw new Error("Insufficient credits");
    }

    const updated = await tx.userCredits.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount: -amount, // negative = deduction
        type: TransactionType.USAGE,
        description,
        status: TransactionStatus.COMPLETED,
      },
    });

    return { updatedBalance: updated.balance, transaction };
  });
}

/**
 * Add credits to a user's balance (on purchase).
 */
export async function addCredits(
  userId: string,
  amount: number,
  stripeSessionId: string,
  stripePaymentIntentId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.userCredits.upsert({
      where: { userId },
      create: { userId, balance: amount },
      update: { balance: { increment: amount } },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.PURCHASE,
        stripeSessionId,
        stripePaymentIntentId,
        description: `Purchased ${amount} credits`,
        status: TransactionStatus.COMPLETED,
      },
    });

    return { updatedBalance: updated.balance, transaction };
  });
}

/**
 * Refund credits to a user after a failed generation.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string
) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.userCredits.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.REFUND,
        description: `Refund for failed generation ${generationId}`,
        status: TransactionStatus.COMPLETED,
      },
    });

    return { updatedBalance: updated.balance, transaction };
  });
}
