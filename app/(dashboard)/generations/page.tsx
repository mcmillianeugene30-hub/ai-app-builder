import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const metadata = { title: "My Generations" };

export default async function GenerationsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const generations = await prisma.generation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Generated Apps</h1>
        <Link href="/generate" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
          ⚡ New App
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🏗️</div>
          <div className="font-medium text-gray-700 mb-1">No apps generated yet</div>
          <div className="text-sm text-gray-400 mb-4">Start by describing what you want to build</div>
          <Link href="/generate" className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700">
            Build Your First App
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {generations.map(gen => {
            const files = Array.isArray(gen.generatedFiles) ? gen.generatedFiles as Array<{path:string}> : [];
            return (
              <Link key={gen.id} href={`/generations/${gen.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  gen.status === "COMPLETED" ? "bg-green-500" :
                  gen.status === "FAILED" ? "bg-red-500" :
                  gen.status === "GENERATING" ? "bg-yellow-400 animate-pulse" : "bg-gray-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-1">{gen.prompt}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(gen.createdAt).toLocaleDateString()} ·{" "}
                    {gen.creditsUsed} credits{" "}
                    {files.length > 0 && `· ${files.length} files`}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  gen.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                  gen.status === "FAILED" ? "bg-red-50 text-red-700" :
                  "bg-yellow-50 text-yellow-700"
                }`}>
                  {gen.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
