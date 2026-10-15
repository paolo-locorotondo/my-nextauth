import { AUTH_ROUTES } from "./config";

const BASE = "http://local.invalid";

/**
 * Normalizza un callbackUrl proveniente dalla query string accettando SOLO
 * path relativi della stessa origine. Qualsiasi altra cosa (URL assoluti,
 * `//evil.com`, backslash, separatori codificati, caratteri di controllo,
 * loop verso le pagine /auth/*) torna al fallback.
 *
 * Better Auth valida già callbackURL/redirectTo lato server: questo è il
 * secondo livello, usato per i redirect fatti dall'app (router, proxy).
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback: string | null = null): string | null {
  if (!raw || raw.length > 2048) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  // es. "/%2F%2Fevil.com" o "/%5Cevil.com"
  if (/^\/(%2f|%5c)/i.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return fallback;

  return url.pathname + url.search + url.hash;
}

/** URL della pagina di smistamento post-login, con il callbackUrl (se valido). */
export function continueUrl(callbackUrl: string | null | undefined): string {
  const safe = safeCallbackUrl(callbackUrl);
  return safe ? `${AUTH_ROUTES.continue}?callbackUrl=${encodeURIComponent(safe)}` : AUTH_ROUTES.continue;
}

/** URL del login con il callbackUrl (se valido). */
export function loginUrl(callbackUrl?: string | null): string {
  const safe = safeCallbackUrl(callbackUrl);
  return safe ? `${AUTH_ROUTES.login}?callbackUrl=${encodeURIComponent(safe)}` : AUTH_ROUTES.login;
}
