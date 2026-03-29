import { loadStripe } from "@stripe/stripe-js";

let stripePromise: ReturnType<typeof loadStripe>;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

export const CREDIT_PACKAGES = [
  {
    id: "starter",
    credits: 100,
    price: 10,
    priceId: process.env.STRIPE_PRICE_100_CREDITS ?? "",
    label: "Starter",
    description: "Perfect for trying it out",
    perCredit: "$0.10",
    popular: false,
  },
  {
    id: "builder",
    credits: 300,
    price: 25,
    priceId: process.env.STRIPE_PRICE_300_CREDITS ?? "",
    label: "Builder",
    description: "Best value for most users",
    perCredit: "$0.083",
    popular: true,
  },
  {
    id: "pro",
    credits: 700,
    price: 50,
    priceId: process.env.STRIPE_PRICE_700_CREDITS ?? "",
    label: "Pro",
    description: "For power builders",
    perCredit: "$0.071",
    popular: false,
  },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];
