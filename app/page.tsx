import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const FEATURES = [
  { icon: "⚡", title: "Instant Generation", desc: "Go from idea to working app in under 2 minutes" },
  { icon: "📦", title: "Download Ready", desc: "Get a complete ZIP with all files, no extra setup needed" },
  { icon: "🔒", title: "Full Stack", desc: "React + Vite frontend, Express backend, SQLite database" },
  { icon: "🎨", title: "Tailwind Styled", desc: "Beautiful, responsive UI out of the box" },
];

const EXAMPLES = [
  "A task manager with drag-and-drop and due dates",
  "A blog platform with markdown editor and comments",
  "An expense tracker with charts and CSV export",
  "A team chat app with rooms and file sharing",
];

const PRICING = [
  { credits: 100, price: "$10", per: "$0.10/credit", label: "Starter", apps: "~20 apps" },
  { credits: 300, price: "$25", per: "$0.083/credit", label: "Builder", apps: "~60 apps", popular: true },
  { credits: 700, price: "$50", per: "$0.071/credit", label: "Pro", apps: "~140 apps" },
];

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">⚡</span>
            <span className="font-bold text-lg">{process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full mb-6">
          🚀 AI-powered app generation
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-6 text-gray-900">
          Describe it. Download it.<br />
          <span className="text-blue-600">Ship it.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Turn natural language into complete, working full-stack applications. 
          React + Vite frontend, Express backend, ready to run.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md">
            Buy Credits & Start Building
          </Link>
          <a href="#pricing" className="border border-gray-300 px-8 py-4 rounded-xl text-lg hover:bg-gray-50 transition-colors">
            View Pricing
          </a>
        </div>

        {/* Example prompts */}
        <div className="mt-16 text-left max-w-2xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-4">Example prompts:</p>
          <div className="space-y-2">
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 flex items-center gap-3">
                <span className="text-blue-400">›</span>
                <span>&quot;{ex}&quot;</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need, ready to run</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="text-center p-6">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Simple credit pricing</h2>
        <p className="text-gray-500 text-center mb-12">5 credits per app generation. Buy once, use anytime.</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PRICING.map((p, i) => (
            <div key={i} className={`card p-8 relative ${p.popular ? "ring-2 ring-blue-500" : ""}`}>
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="text-lg font-semibold mb-1">{p.label}</div>
              <div className="text-4xl font-bold mb-1">{p.price}</div>
              <div className="text-sm text-gray-400 mb-2">{p.per}</div>
              <div className="text-sm text-gray-500 mb-6">{p.credits} credits · {p.apps}</div>
              <Link
                href="/signup"
                className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                  p.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          Powered by Stripe · Secure payments · Credits never expire
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder"}. No free tier. Real products.</p>
      </footer>
    </div>
  );
}
