import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readToken, safeAdminPath, SESSION_COOKIE } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readToken(token) : null;
  const isAdmin = session?.role === "admin";

  if (pathname.startsWith("/api/admin") && !isAdmin) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (pathname === "/admin/login") {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", safeAdminPath(pathname));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
