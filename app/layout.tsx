import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder",
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder"}`,
  },
  description: "Build full-stack apps from natural language descriptions",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
