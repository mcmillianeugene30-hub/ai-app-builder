"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CREDIT_PACKAGES } from "@/lib/stripe/client";

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
    status: string;
  }>>([]);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0));
    fetch("/api/credits/transactions")
      .then(r => r.json())
      .then(d => setTransactions(d.transactions ?? []));
  }, [success]);

  async function handlePurchase(packageId: string, priceId: string) {
    setLoadingId(packageId);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p className="text-gray-500 text-sm mt-0.5">Credits power your app generations. Each app costs 5 credits.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-semibold">Payment successful!</div>
            <div className="text-sm">Your credits have been added to your account.</div>
          </div>
        </div>
      )}
      {canceled && (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-5 py-4 rounded-xl">
          Payment was canceled. No charges were made.
        </div>
      )}

      {/* Current balance */}
      <div className="card p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">Current Balance</div>
          <div className="text-3xl font-bold text-blue-600">🎫 {balance ?? "—"} credits</div>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>{balance !== null ? Math.floor(balance / 5) : "—"} apps remaining</div>
          <div>@ 5 credits per app</div>
        </div>
      </div>

      {/* Packages */}
      <div className="grid md:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`card p-6 relative flex flex-col ${pkg.popular ? "ring-2 ring-blue-500" : ""}`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className="text-lg font-semibold">{pkg.label}</div>
            <div className="text-3xl font-bold mt-1">${pkg.price}</div>
            <div className="text-sm text-gray-400 mt-1">{pkg.perCredit}/credit</div>
            <div className="text-sm text-gray-500 mt-1 mb-4">{pkg.credits} credits · ~{Math.floor(pkg.credits / 5)} apps</div>
            <div className="mt-auto">
              <button
                onClick={() => handlePurchase(pkg.id, pkg.priceId)}
                disabled={loadingId === pkg.id}
                className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                  pkg.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {loadingId === pkg.id ? "Redirecting..." : `Buy ${pkg.credits} Credits`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400">
        🔒 Secure payments via Stripe · Credits never expire · No subscriptions
      </p>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Transaction History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{tx.description ?? tx.type}</div>
                  <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={tx.amount > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
