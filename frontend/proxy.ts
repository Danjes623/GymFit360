import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/register-admin", "/verificar-cuenta", "/olvide-password", "/restablecer-password"];
const publicExact = ["/"];

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function decodeRole(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.rol ? String(decoded.rol) : null;
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return (decoded.exp as number) * 1000 < Date.now();
}

const roleRoutes: Record<string, string> = {
  admin: "/dashboard",
  recepcionista: "/dashboard",
  usuario: "/mi-perfil",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "");

  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) || publicExact.some((p) => pathname === p);
  const isPrivate = !isPublic && pathname !== "/favicon.ico";

  if (isPublic && token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPrivate && (!token || isTokenExpired(token))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && !isTokenExpired(token)) {
    const role = decodeRole(token);

    if (role === "usuario" && (pathname.startsWith("/dashboard") || pathname.startsWith("/afiliados") || pathname.startsWith("/entrenadores") || pathname.startsWith("/membresias") || pathname.startsWith("/clases") || pathname.startsWith("/planes") || pathname.startsWith("/reportes"))) {
      return NextResponse.redirect(new URL("/mi-perfil", request.url));
    }

    if ((role === "admin" || role === "recepcionista") && pathname.startsWith("/mi-perfil")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (role === "usuario" && (pathname === "/" || pathname === "")) {
      return NextResponse.redirect(new URL("/mi-perfil", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
