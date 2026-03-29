import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function assertAdmin(): Promise<boolean> {
  const session = await auth();
  return !!(session?.user?.email && session.user.email === ADMIN_EMAIL);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      credits: { select: { balance: true } },
      generations: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          prompt: true,
          status: true,
          creditsUsed: true,
          createdAt: true,
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      },
      _count: { select: { generations: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const completedGenerations = await prisma.generation.count({
    where: { userId: id, status: "COMPLETED" },
  });

  const totalSpentAgg = await prisma.transaction.aggregate({
    where: { userId: id, type: "USAGE" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    balance: user.credits?.balance ?? 0,
    totalGenerations: user._count.generations,
    completedGenerations,
    totalSpent: Math.abs(totalSpentAgg._sum.amount ?? 0),
    generations: user.generations.map(g => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
    })),
    transactions: user.transactions.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
