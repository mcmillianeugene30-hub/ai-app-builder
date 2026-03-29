import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/dashboard", "/generate", "/generations", "/credits", "/templates", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtected = PROTECTED_PREFIXES.some(p => nextUrl.pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some(p => nextUrl.pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    const role = (req.auth?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
