import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 font-bold text-lg">
            ⚡ AppBuilder
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back to App
        </Link>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
