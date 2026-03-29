import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export const CREDIT_PACKAGES_SERVER = [
  {
    id: "starter",
    credits: 100,
    price: 10,
    priceId: process.env.STRIPE_PRICE_100_CREDITS!,
    label: "Starter",
  },
  {
    id: "builder",
    credits: 300,
    price: 25,
    priceId: process.env.STRIPE_PRICE_300_CREDITS!,
    label: "Builder",
  },
  {
    id: "pro",
    credits: 700,
    price: 50,
    priceId: process.env.STRIPE_PRICE_700_CREDITS!,
    label: "Pro",
  },
];

/**
 * Create or retrieve Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const { prisma } = await import("@/lib/db/prisma");
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
