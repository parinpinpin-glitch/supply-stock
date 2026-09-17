import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // ปล่อย static ผ่าน; API ให้ route handler ตรวจ auth เอง (ตอบ 401 JSON)
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // หน้าเฉพาะ Admin
  if ((pathname === "/users" || pathname.startsWith("/users/")) && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/no-access";
    return NextResponse.redirect(url);
  }
  if (
    (pathname === "/notifications" || pathname.startsWith("/notifications/")) &&
    session.role !== "admin"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/no-access";
    return NextResponse.redirect(url);
  }

  // หน้าเฉพาะผู้ซื้อ/Admin
  if (
    (pathname === "/orders" || pathname.startsWith("/orders/")) &&
    session.role !== "purchaser" &&
    session.role !== "admin"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/no-access";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
