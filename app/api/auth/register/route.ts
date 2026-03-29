import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendWelcome } from "@/lib/email";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        passwordHash,
        credits: { create: { balance: 0 } }, // no free credits!
      },
    });

    // Non-blocking welcome email
    sendWelcome(user.email, user.name ?? undefined).catch(() => {});

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
