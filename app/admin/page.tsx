import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className={`bg-white border rounded-xl p-5 ${accent ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}>
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-2 uppercase tracking-wide font-medium">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? "text-blue-700" : "text-gray-900"}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const [
    totalUsers,
    generationGroups,
    transactionGroups,
    recentUsers,
    recentGenerations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.generation.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.generation.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const completedCount = generationGroups.find(g => g.status === "COMPLETED")?._count.id ?? 0;
  const failedCount = generationGroups.find(g => g.status === "FAILED")?._count.id ?? 0;
  const totalGenerations = generationGroups.reduce((sum, g) => sum + g._count.id, 0);
  const successRate = totalGenerations > 0 ? Math.round((completedCount / totalGenerations) * 100) : 0;

  const creditsPurchased = transactionGroups.find(t => t.type === "PURCHASE")?._sum.amount ?? 0;
  const creditsConsumed = Math.abs(transactionGroups.find(t => t.type === "USAGE")?._sum.amount ?? 0);
  const creditsRefunded = transactionGroups.find(t => t.type === "REFUND")?._sum.amount ?? 0;

  // Approximate revenue based on blended rate (~$0.083/credit across the 3 packages)
  const approxRevenue = ((creditsPurchased ?? 0) * 0.083).toFixed(0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform-wide metrics and activity</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👤"
          label="Total Users"
          value={totalUsers.toLocaleString()}
          sub="all time signups"
        />
        <StatCard
          icon="⚡"
          label="Generations"
          value={totalGenerations.toLocaleString()}
          sub={`${successRate}% success rate`}
          accent
        />
        <StatCard
          icon="🎫"
          label="Credits Sold"
          value={(creditsPurchased ?? 0).toLocaleString()}
          sub={`~$${approxRevenue} revenue`}
        />
        <StatCard
          icon="🔥"
          label="Credits Consumed"
          value={(creditsConsumed ?? 0).toLocaleString()}
          sub={`${creditsRefunded ?? 0} refunded`}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Completed generations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{failedCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Failed generations</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {totalUsers > 0 ? (completedCount / totalUsers).toFixed(1) : "0"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg generations / user</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm">Recent Signups</h2>
          </div>
          {recentUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No users yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.name ?? user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-3 shrink-0">
                    {timeAgo(user.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent generations */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-sm">Recent Generations</h2>
          </div>
          {recentGenerations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No generations yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentGenerations.map(gen => (
                <div key={gen.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-400 truncate">{gen.user.email}</div>
                      <div className="text-sm line-clamp-1 mt-0.5">{gen.prompt}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          gen.status === "COMPLETED"
                            ? "bg-green-50 text-green-700"
                            : gen.status === "FAILED"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {gen.status}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(gen.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
