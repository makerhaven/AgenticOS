import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Single-user passcode lock. When CONTROL_PASSCODE is set, /control requires
 * a cookie obtained from /control/lock. Default: open (local use).
 */
export function middleware(request: NextRequest) {
  const pass = process.env.CONTROL_PASSCODE;
  if (!pass) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.endsWith("/lock") || pathname.includes("/api/lock")) return NextResponse.next();

  const cookie = request.cookies.get("aos_lock")?.value;
  if (cookie === pass) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `${url.pathname.replace(/\/control.*$/, "/control")}/lock`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/control/:path*"],
};
