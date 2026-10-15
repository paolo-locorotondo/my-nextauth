import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { hasRole, isPending, type RoleInput } from "./roles";
import { loginUrl } from "./safe-redirect";
import { auth, type Session } from "./server";

export { ROLES, type Role } from "./config";
export { hasRole, isAdmin, isPending } from "./roles";

export type AuthOk = { ok: true; session: Session["session"]; user: Session["user"] };
export type AuthFailReason = "unauthenticated" | "pending" | "forbidden";

export type GuardOptions = {
  /** Consente l'accesso anche agli utenti in PENDING_ROLES (es. cambio password). */
  allowPending?: boolean;
};

/**
 * Logica comune: sessione → ruolo. La sessione è letta dal DB a ogni
 * richiesta (cookieCache disattivato), quindi un cambio di ruolo o la
 * revoca della sessione hanno effetto immediato.
 */
function check(session: Session | null, roles?: RoleInput, opts?: GuardOptions): AuthOk | { ok: false; reason: AuthFailReason } {
  if (!session) return { ok: false, reason: "unauthenticated" };
  if (!opts?.allowPending && isPending(session.user) && !hasRole(session.user, roles ?? [])) {
    return { ok: false, reason: "pending" };
  }
  if (!hasRole(session.user, roles)) return { ok: false, reason: "forbidden" };
  return { ok: true, session: session.session, user: session.user };
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Per i Route Handler. Uso:
 *   const auth = await validateAuth(req, "ADMIN");
 *   if (!auth.ok) return auth.errorResponse;
 */
export async function validateAuth(
  request: Request,
  roles?: RoleInput,
  opts?: GuardOptions,
): Promise<AuthOk | { ok: false; reason: AuthFailReason; errorResponse: NextResponse }> {
  const session = await auth.api.getSession({ headers: request.headers });
  const r = check(session, roles, opts);
  if (r.ok) return r;
  return {
    ...r,
    errorResponse: r.reason === "unauthenticated" ? unauthorizedResponse() : forbiddenResponse(r.reason === "pending" ? "Pending approval" : "Forbidden"),
  };
}

/** Per Server Component e Server Action: restituisce il motivo del rifiuto, la pagina decide cosa mostrare. */
export async function validateAuthFromServerSession(roles?: RoleInput, opts?: GuardOptions) {
  const session = await auth.api.getSession({ headers: await headers() });
  return check(session, roles, opts);
}

/** Sessione corrente o null, senza controlli di ruolo (UI cosmetica: header, menu). */
export async function getOptionalSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export class AuthError extends Error {
  constructor(public reason: AuthFailReason) {
    super(`Auth: ${reason}`);
  }
}

/**
 * Per le Server Action (raggiungibili con POST diretti: vanno SEMPRE protette).
 * Lancia AuthError se l'utente non è autorizzato.
 */
export async function requireRole(roles?: RoleInput, opts?: GuardOptions): Promise<AuthOk> {
  const r = await validateAuthFromServerSession(roles, opts);
  if (!r.ok) throw new AuthError(r.reason);
  return r;
}

/** Per le pagine: come requireRole, ma se non autenticato fa redirect al login. */
export async function requirePageAuth(callbackPath: string, roles?: RoleInput, opts?: GuardOptions) {
  const r = await validateAuthFromServerSession(roles, opts);
  if (!r.ok && r.reason === "unauthenticated") redirect(loginUrl(callbackPath));
  return r;
}
