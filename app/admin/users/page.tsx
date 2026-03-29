import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const metadata = { title: "Users — Admin" };
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

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminUsersPage({ searchParams }: SearchProps) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;
  const query = q?.trim() ?? "";

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        credits: { select: { balance: true } },
        _count: { select: { generations: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← Dashboard
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by email or name…"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Search
        </button>
        {query && (
          <a href="/admin/users" className="px-4 py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">
            Clear
          </a>
        )}
      </form>

      {/* User table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Credits
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Generations
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Joined
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  {query ? `No users matching "${query}"` : "No users yet"}
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {user.name ?? user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className={`font-semibold ${(user.credits?.balance ?? 0) === 0 ? "text-gray-400" : "text-gray-900"}`}>
                      {(user.credits?.balance ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-700">
                    {user._count.generations.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 text-xs">
                    {timeAgo(user.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/users?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ← Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/users?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
