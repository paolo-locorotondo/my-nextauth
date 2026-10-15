import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { PROTECTED_PREFIXES } from "@/lib/auth/config";
import { loginUrl } from "@/lib/auth/safe-redirect";

/**
 * Check OTTIMISTICO: verifica solo che il cookie di sessione esista (nessuna
 * query al DB). La validazione reale di sessione e ruolo è negli helper di
 * lib/auth/helpers.ts, da usare in ogni pagina, route handler e server action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected || getSessionCookie(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL(loginUrl(pathname + search), request.url));
  // Evita che il redirect venga messo in cache dal prefetch del router
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  // Ampio di proposito: la lista da mantenere è solo PROTECTED_PREFIXES
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\..*).*)"],
};
