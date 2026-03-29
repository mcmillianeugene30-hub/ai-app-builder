import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      prompt: true,
      status: true,
      creditsUsed: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({ generations });
}
