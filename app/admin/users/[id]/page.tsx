"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  balance: number;
  totalGenerations: number;
  completedGenerations: number;
  totalSpent: number;
  generations: Array<{
    id: string;
    prompt: string;
    status: string;
    creditsUsed: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }>;
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
    GENERATING: "bg-yellow-50 text-yellow-700",
    PENDING: "bg-gray-50 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? "bg-gray-50 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Credit adjustment form state
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setUser(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load user");
        setLoading(false);
      });
  }, [id]);

  async function handleUpdateRole(newRole: string) {
    if (!user || user.role === newRole) return;
    setUpdatingRole(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUser({ ...user, role: newRole });
    }
    setUpdatingRole(false);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(delta);
    if (isNaN(amount) || amount === 0) return;

    setAdjusting(true);
    setAdjustMsg("");

    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, delta: amount, reason: reason.trim() || undefined }),
    });
    const data = await res.json();

    if (res.ok) {
      setAdjustMsg(`✓ Balance updated to ${data.newBalance} credits`);
      if (user) {
        setUser({ ...user, balance: data.newBalance });
      }
      setDelta("");
      setReason("");
    } else {
      setAdjustMsg(`Error: ${data.error}`);
    }
    setAdjusting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="card p-8 text-center">
        <div className="text-red-500 text-sm">{error || "User not found"}</div>
        <Link href="/admin/users" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin" className="hover:underline">Admin</Link>
            <span>›</span>
            <Link href="/admin/users" className="hover:underline">Users</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">{user.name ?? user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>
            <select
              value={user.role}
              disabled={updatingRole}
              onChange={(e) => handleUpdateRole(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {user.name && <p className="text-gray-500 text-sm">{user.email}</p>}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Credits", value: user.balance.toLocaleString(), accent: true },
          { label: "Total Gens", value: user.totalGenerations.toString() },
          { label: "Completed", value: user.completedGenerations.toString() },
          { label: "Credits Spent", value: user.totalSpent.toLocaleString() },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`bg-white border rounded-xl p-4 ${accent ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}>
            <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</div>
            <div className={`text-2xl font-bold ${accent ? "text-blue-700" : "text-gray-900"}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Credit adjustment */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold mb-1">Adjust Credits</h2>
            <p className="text-xs text-gray-400 mb-4">
              Current balance: <strong>{user.balance}</strong>. Use positive numbers to add, negative to deduct.
            </p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Amount (+/-)</label>
                <input
                  type="number"
                  value={delta}
                  onChange={e => setDelta(e.target.value)}
                  placeholder="e.g. +50 or -20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Goodwill credit, refund request"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={adjusting || !delta}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {adjusting ? "Adjusting…" : "Apply Adjustment"}
              </button>
              {adjustMsg && (
                <p className={`text-xs text-center ${adjustMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                  {adjustMsg}
                </p>
              )}
            </form>
          </div>

          {/* Recent transactions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-sm">Transactions</h2>
            </div>
            {user.transactions.length === 0 ? (
              <div className="px-5 py-6 text-center text-xs text-gray-400">No transactions</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {user.transactions.map(tx => (
                  <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-gray-700">{tx.type}</div>
                      {tx.description && (
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">{tx.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </div>
                      <div className="text-xs text-gray-400">{timeAgo(tx.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generation history */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm">Generation History</h2>
          </div>
          {user.generations.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">No generations yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {user.generations.map(gen => (
                <div key={gen.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-700 line-clamp-2 flex-1">{gen.prompt}</p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={gen.status} />
                      <span className="text-xs text-gray-400">{timeAgo(gen.createdAt)}</span>
                      <span className="text-xs text-gray-400">{gen.creditsUsed} cr</span>
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
