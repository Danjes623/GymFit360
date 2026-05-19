import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "");

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isDashboard = pathname.startsWith("/dashboard") || pathname === "/";

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
