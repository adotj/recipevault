import { NextResponse, type NextRequest } from "next/server";
import { verifyVaultSessionToken, VAULT_COOKIE_NAME } from "@/lib/vault-session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/gate") return true;
  if (pathname.startsWith("/api/vault-auth")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionSecret = process.env.VAULT_SESSION_SECRET;
  if (!sessionSecret) {
    return new NextResponse(
      "Server misconfiguration: set VAULT_SESSION_SECRET (and related vault env vars).",
      { status: 500 }
    );
  }

  const token = request.cookies.get(VAULT_COOKIE_NAME)?.value;
  if (!token || !(await verifyVaultSessionToken(token, sessionSecret))) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.search = "";
    const next =
      pathname && pathname !== "/" ? pathname + request.nextUrl.search : "/";
    if (pathname !== "/") {
      url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
