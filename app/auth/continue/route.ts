import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROUTES, landingForRole } from "@/lib/auth/config";
import { loginUrl, safeCallbackUrl } from "@/lib/auth/safe-redirect";
import { auth } from "@/lib/auth/server";

/** Errori del link di verifica: si torna alla pagina verify-email con il pulsante "reinvia". */
const VERIFY_ERRORS = new Set(["INVALID_TOKEN", "TOKEN_EXPIRED", "invalid_token", "token_expired"]);

function redirectTo(path: string, request: NextRequest) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

/**
 * Smistamento post-login (email, Google, OIDC, verifica email):
 * callbackUrl valido → lì; altrimenti landingForRole(ruolo).
 * Tutti i flussi passano di qui con callbackURL = continueUrl(callbackUrl).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));

  const error = params.get("error");
  if (error) {
    const target = VERIFY_ERRORS.has(error) ? AUTH_ROUTES.verifyEmail : AUTH_ROUTES.error;
    return redirectTo(`${target}?error=${encodeURIComponent(error)}`, request);
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return redirectTo(loginUrl(callbackUrl), request);

  return redirectTo(callbackUrl ?? landingForRole(session.user.role), request);
}
