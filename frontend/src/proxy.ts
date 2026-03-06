import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): { id: string; role: string } | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded;
  } catch {
    return null;
  }
}

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload;
  const role = payload?.role;

  // Auth pages: redirect away if already logged in
  if (AUTH_PAGES.some((page) => pathname.startsWith(page))) {
    if (isAuthenticated) {
      const dest = role === "admin" || role === "staff" ? "/admin" : "/menu";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Admin routes: require admin or staff
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "admin" && role !== "staff") {
      return NextResponse.redirect(new URL("/menu", request.url));
    }
    return NextResponse.next();
  }

  // Protected customer pages
  if (["/dashboard", "/menu", "/cart", "/orders", "/profile"].some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/menu/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/profile/:path*",
  ],
};
