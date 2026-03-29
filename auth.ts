import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";

// Explicitly use Node.js runtime for auth to avoid Edge compatibility issues
export const runtime = "nodejs";

// The full config for Node.js runtime
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Filter out credentials provider from auth.config since we add our own with bcrypt
    ...authConfig.providers.filter(p => {
      // Type-safe filter - check if this is the credentials provider
      const anyP = p as any;
      return anyP.id !== "credentials" && anyP.name !== "credentials";
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email as string } 
        });
        
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        );
        
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // Initialize credit balance at 0 for new users
      await prisma.userCredits.create({
        data: { userId: user.id!, balance: 0 },
      });
    },
  },
});
