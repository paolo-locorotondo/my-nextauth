import "server-only";
import { after } from "next/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { AUTH_ROUTES, DEFAULT_ROLE, PASSWORD_POLICY, ROLES } from "./config";
import { sendAuthEmail } from "./email";
import { env, providers } from "./env";
import { passwordError } from "./password-policy";
import { texts } from "./texts";

/** Endpoint che ricevono una nuova password, e il campo del body che la contiene. */
const PASSWORD_FIELDS: Record<string, "password" | "newPassword"> = {
  "/sign-up/email": "password",
  "/reset-password": "newPassword",
  "/change-password": "newPassword",
};

/** URL assoluto di una pagina dell'app (per i link nelle email). */
const appUrl = (path: string) => new URL(path, env.BETTER_AUTH_URL || "http://localhost:3000").toString();

/** Esegue un task dopo la risposta (Next `after`); fuori da una request lo lascia girare. */
function runInBackground(promise: Promise<unknown>) {
  try {
    after(promise);
  } catch {
    void promise;
  }
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: PASSWORD_POLICY.min,
    maxPasswordLength: PASSWORD_POLICY.max,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail("reset", user, url);
    },
    // Registrazione con un'email già esistente (es. utente Google): per non rivelare
    // quali email sono registrate Better Auth risponde come a una registrazione
    // nuova e non invia nulla. Avvisiamo il titolare con un'email dedicata.
    onExistingUserSignUp: async ({ user }) => {
      await sendAuthEmail("existing", user, appUrl(AUTH_ROUTES.login), {
        label: texts.email.existing.secondary,
        url: appUrl(AUTH_ROUTES.forgotPassword),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    // Il login di un utente non verificato (403) reinvia il link
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail("verify", user, url);
    },
  },

  socialProviders: providers.google
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},

  account: {
    // Stessa email da Google/OIDC → collega all'utente esistente (che deve
    // aver verificato l'email, default di Better Auth: requireLocalEmailVerified).
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", ...(providers.oidc ? [providers.oidc.id] : [])],
    },
  },

  user: {
    additionalFields: {
      role: {
        type: [...ROLES],
        required: false,
        defaultValue: DEFAULT_ROLE,
        // Non impostabile dal client in fase di registrazione
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isBootstrapAdmin = env.adminEmails.includes(user.email.toLowerCase());
          return { data: { ...user, role: isBootstrapAdmin ? "ADMIN" : DEFAULT_ROLE } };
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const field = PASSWORD_FIELDS[ctx.path];
      if (!field) return;
      const value = ctx.body?.[field];
      const message = typeof value === "string" ? passwordError(value) : null;
      if (message) throw new APIError("BAD_REQUEST", { message, code: "PASSWORD_POLICY" });
    }),
  },

  rateLimit: {
    enabled: env.rateLimitEnabled,
    // "memory" non funziona su serverless (istanze multiple): usa la tabella rateLimit
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
    },
  },

  onAPIError: {
    errorURL: AUTH_ROUTES.error,
  },

  advanced: {
    ipAddress: { ipAddressHeaders: env.ipHeaders },
    // Le email partono dopo la risposta: tempi di risposta indipendenti dall'esistenza dell'utente
    backgroundTasks: { handler: runInBackground },
  },

  plugins: [
    ...(providers.oidc
      ? [
          genericOAuth({
            config: [
              {
                providerId: providers.oidc.id,
                discoveryUrl: env.OIDC_DISCOVERY_URL!,
                clientId: env.OIDC_CLIENT_ID!,
                clientSecret: env.OIDC_CLIENT_SECRET!,
                scopes: env.oidcScopes,
                pkce: true,
              },
            ],
          }),
        ]
      : []),
    // Deve restare l'ultimo plugin: imposta i cookie nelle server action
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
