import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCreditBalance } from "@/lib/credits/manager";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await getCreditBalance(session.user.id);
  return NextResponse.json({ balance });
}
