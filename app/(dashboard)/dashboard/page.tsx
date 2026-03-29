import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getCreditBalance } from "@/lib/credits/manager";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [balance, recentGenerations] = await Promise.all([
    getCreditBalance(userId),
    prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const COST_PER_GEN = parseInt(process.env.CREDITS_PER_GENERATION ?? "5");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {session!.user?.name ?? session!.user?.email}</p>
        </div>
        <Link
          href="/generate"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>⚡</span> New App
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Credit Balance</div>
          <div className="text-3xl font-bold text-blue-600">🎫 {balance}</div>
          <div className="text-xs text-gray-400 mt-1">{Math.floor(balance / COST_PER_GEN)} apps remaining</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Total Apps Built</div>
          <div className="text-3xl font-bold">{recentGenerations.length}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Cost Per App</div>
          <div className="text-3xl font-bold">{COST_PER_GEN}</div>
          <div className="text-xs text-gray-400 mt-1">credits per generation</div>
        </div>
      </div>

      {/* CTA if low credits */}
      {balance < COST_PER_GEN && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-800">You need more credits to build</div>
              <div className="text-sm text-amber-700 mt-0.5">Each app costs {COST_PER_GEN} credits. You have {balance}.</div>
            </div>
            <Link href="/credits" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700">
              Buy Credits
            </Link>
          </div>
        </div>
      )}

      {/* Recent Generations */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">Recent Generations</h2>
          <Link href="/generations" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentGenerations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏗️</div>
            <div className="font-medium text-gray-700 mb-1">Nothing built yet</div>
            <div className="text-sm text-gray-400 mb-4">Describe your app and we&apos;ll generate the full code</div>
            <Link href="/generate" className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
              Build Your First App
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentGenerations.map(gen => (
              <Link key={gen.id} href={`/generations/${gen.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    gen.status === "COMPLETED" ? "bg-green-500" :
                    gen.status === "FAILED" ? "bg-red-500" : "bg-yellow-500"
                  }`} />
                  <div>
                    <div className="text-sm font-medium line-clamp-1">{gen.prompt}</div>
                    <div className="text-xs text-gray-400">{formatDistanceToNow(gen.createdAt)} ago · {gen.creditsUsed} credits</div>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
