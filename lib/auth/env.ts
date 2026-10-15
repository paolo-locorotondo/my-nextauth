import "server-only";
import { z } from "zod";

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const schema = z.object({
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  TRUSTED_ORIGINS: z.string().optional(),
  AUTH_ADMIN_EMAILS: z.string().optional(),
  AUTH_RATE_LIMIT: z.string().optional(),
  AUTH_IP_HEADERS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OIDC_PROVIDER_ID: z.string().regex(/^[a-z0-9-]*$/, "OIDC_PROVIDER_ID: solo minuscole, numeri e trattini").optional(),
  OIDC_LABEL: z.string().optional(),
  OIDC_DISCOVERY_URL: z.string().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  OIDC_SCOPES: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["console", "resend", "sendgrid"]).optional().or(z.literal("")),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
});

const raw = schema.parse(process.env);

const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (isProd && !isBuild) {
  if (!raw.BETTER_AUTH_SECRET || raw.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET mancante o troppo corto (min 32 caratteri): genera con `openssl rand -base64 32` oppure `node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"`");
  }
  if (!raw.BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL mancante (es. https://tuodominio.it)");
}

const oidcEnabled = Boolean(raw.OIDC_PROVIDER_ID && raw.OIDC_DISCOVERY_URL && raw.OIDC_CLIENT_ID && raw.OIDC_CLIENT_SECRET);

export const env = {
  ...raw,
  trustedOrigins: list(raw.TRUSTED_ORIGINS),
  adminEmails: list(raw.AUTH_ADMIN_EMAILS).map((e) => e.toLowerCase()),
  ipHeaders: list(raw.AUTH_IP_HEADERS || "x-forwarded-for"),
  rateLimitEnabled: isProd || raw.AUTH_RATE_LIMIT === "on",
  emailProvider: raw.EMAIL_PROVIDER || (isProd ? undefined : "console"),
  emailFrom: raw.EMAIL_FROM || "My App <noreply@example.com>",
  oidcScopes: (raw.OIDC_SCOPES || "openid profile email").split(/\s+/).filter(Boolean),
};

/** Provider attivi, calcolati dalle env. Usato dal server e (via props) dalla pagina di login. */
export const providers = {
  google: Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET),
  oidc: oidcEnabled ? { id: raw.OIDC_PROVIDER_ID!, label: raw.OIDC_LABEL || "SSO" } : null,
};

export type EnabledProviders = typeof providers;
