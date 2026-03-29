import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      credits: true,
      generations: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: {
          generations: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const completedGenerations = await prisma.generation.count({
    where: { userId: id, status: "COMPLETED" },
  });

  const totalSpent = await prisma.transaction.aggregate({
    where: { userId: id, type: "USAGE" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    balance: user.credits?.balance ?? 0,
    totalGenerations: user._count.generations,
    completedGenerations,
    totalSpent: Math.abs(totalSpent._sum.amount ?? 0),
    generations: user.generations,
    transactions: user.transactions,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role } = await req.json();

  if (!role || (role !== "USER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json({ role: user.role });
}
