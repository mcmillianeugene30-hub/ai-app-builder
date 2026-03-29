import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, CREDIT_PACKAGES_SERVER, getOrCreateStripeCustomer } from "@/lib/stripe/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId } = await req.json();

    // Validate priceId belongs to one of our packages
    const pkg = CREDIT_PACKAGES_SERVER.find(p => p.priceId === priceId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email!,
      session.user.name
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${appUrl}/credits?success=1`,
      cancel_url: `${appUrl}/credits?canceled=1`,
      metadata: {
        userId: session.user.id,
        credits: pkg.credits.toString(),
        packageId: pkg.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[credits/purchase]", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
