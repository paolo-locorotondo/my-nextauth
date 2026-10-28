/**
 * Configurazione dell'autenticazione: è l'UNICO file da adattare quando
 * si copia il template in un nuovo progetto (insieme a texts.ts per i testi).
 *
 * Questo modulo non importa nulla di server-only: è usato anche da proxy.ts
 * e dai componenti client.
 */

/** Ruoli applicativi. Il primo elemento non ha significato speciale. */
export const ROLES = ["NUOVO", "USER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Ruolo assegnato a ogni nuovo utente (registrazione, Google, OIDC). Deve coincidere con il @default di User.role nello schema Prisma. */
export const DEFAULT_ROLE: Role = "NUOVO";

/** Ruoli "in attesa di approvazione": possono loggarsi ma vedono <PendingApproval/> sulle pagine protette. */
export const PENDING_ROLES: readonly Role[] = ["NUOVO"];

/** Ruoli amministrativi (es. accesso a /admin). */
export const ADMIN_ROLES: readonly Role[] = ["ADMIN"];

export const AUTH_ROUTES = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",
  /** Smistamento post-login: callbackUrl valido oppure landingForRole(). */
  continue: "/auth/continue",
  error: "/auth/error",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  changePassword: "/user/change-password",
} as const;

/** Pagina di atterraggio dopo il login quando non c'è un callbackUrl. */
export function landingForRole(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin/users";
    default:
      return "/dashboard";
  }
}

/**
 * Prefissi protetti dal proxy (check ottimistico del cookie di sessione).
 * Le pagine → redirect al login con callbackUrl; le API → 401 JSON.
 * Il controllo vero (sessione valida + ruolo) resta negli helper di helpers.ts.
 */
export const PROTECTED_PREFIXES: readonly string[] = ["/dashboard", "/admin", "/user", "/api/demo"];

/** Regole password (stesse di order-app). Applicate lato client e lato server. */
export const PASSWORD_POLICY = {
  min: 8,
  max: 128,
  upper: true,
  lower: true,
  digit: true,
  special: true,
} as const;
