import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { addCredits } from "@/lib/credits/manager";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle relevant events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits ?? "0");

      if (!userId || !credits) {
        console.error("[stripe/webhook] Missing metadata in session", session.id);
        break;
      }

      if (session.payment_status !== "paid") {
        console.log("[stripe/webhook] Session not paid yet, skipping", session.id);
        break;
      }

      try {
        await addCredits(
          userId,
          credits,
          session.id,
          session.payment_intent as string | undefined
        );
        console.log(`[stripe/webhook] Added ${credits} credits to user ${userId}`);
      } catch (error) {
        console.error("[stripe/webhook] Failed to add credits:", error);
        // Return 500 so Stripe retries the webhook
        return NextResponse.json({ error: "Failed to grant credits" }, { status: 500 });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.warn("[stripe/webhook] Payment failed:", intent.id);
      // Credits were never granted, so no refund needed
      break;
    }

    default:
      // Unhandled event type — ignore
      console.log("[stripe/webhook] Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}
