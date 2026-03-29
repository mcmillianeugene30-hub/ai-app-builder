"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then(r => r.json())
      .then(d => setCredits(d.balance ?? 0))
      .catch(() => {});
  }, [pathname]);

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/generate", label: "Build App" },
    { href: "/credits", label: "Buy Credits" },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-600">
            <span>⚡</span>
            <span>{process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder"}</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Credit balance */}
            <Link
              href="/credits"
              className={`hidden md:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                credits !== null && credits < 10
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>🎫</span>
              <span>{credits ?? "—"} credits</span>
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center"
              >
                A
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Low credit banner */}
      {credits !== null && credits < 10 && credits > 0 && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          ⚠️ Low credits ({credits} remaining).{" "}
          <Link href="/credits" className="font-semibold underline">Buy more to keep building →</Link>
        </div>
      )}
      {credits !== null && credits === 0 && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-center text-sm text-red-800">
          🚫 You&apos;re out of credits.{" "}
          <Link href="/credits" className="font-semibold underline">Purchase credits to generate apps →</Link>
        </div>
      )}
    </header>
  );
}
