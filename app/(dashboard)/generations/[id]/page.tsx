import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import GenerationViewer from "@/components/GenerationViewer";

export const metadata = { title: "View Generation" };

export default async function GenerationPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user!.id!;

  const generation = await prisma.generation.findFirst({
    where: { id: params.id, userId },
  });

  if (!generation) notFound();

  const files = Array.isArray(generation.generatedFiles)
    ? (generation.generatedFiles as Array<{ path: string; content: string }>)
    : [];

  return (
    <GenerationViewer
      generation={{
        id: generation.id,
        prompt: generation.prompt,
        status: generation.status,
        creditsUsed: generation.creditsUsed,
        createdAt: generation.createdAt.toISOString(),
        errorMessage: generation.errorMessage,
        files,
      }}
    />
  );
}
