# MANIFEST: cosa copiare in un nuovo progetto

Legenda: **core** = da copiare così com'è · **adatta** = da copiare e personalizzare · **demo** = solo esempio, non copiare (o usalo come spunto).

## Libreria (`lib/`)

| File | Tipo | Ruolo |
|---|---|---|
| `lib/auth/config.ts` | **adatta** | Ruoli, ruolo di default, ruoli pending/admin, rotte auth, `landingForRole()`, `PROTECTED_PREFIXES`, password policy |
| `lib/auth/texts.ts` | **adatta** | Tutti i testi UI ed email (italiano) |
| `lib/auth/server.ts` | core | Istanza `betterAuth` (provider, linking, hook, rate limit, email) |
| `lib/auth/client.ts` | core | `authClient` per i componenti React |
| `lib/auth/env.ts` | core | Validazione env (zod) e provider attivi |
| `lib/auth/helpers.ts` | core | `validateAuth`, `validateAuthFromServerSession`, `requireRole`, `requirePageAuth`, `getOptionalSession` |
| `lib/auth/roles.ts` | core | `hasRole`, `isPending`, `isAdmin`, `isRole` |
| `lib/auth/safe-redirect.ts` | core | `safeCallbackUrl`, `loginUrl`, `continueUrl` (anti open redirect) |
| `lib/auth/password-policy.ts` | core | Schema zod password/email, condiviso client e server |
| `lib/auth/errors.ts` | core | Codici di errore Better Auth → messaggi di `texts.ts` |
| `lib/auth/email/*` | core | `sendAuthEmail`, adapter `console` / `resend` / `sendgrid`, template |
| `lib/db.ts` | core* | Singleton `PrismaClient` (*salta se il progetto ne ha già uno: aggiorna l'import in `server.ts`) |

## Next.js

| File | Tipo | Ruolo |
|---|---|---|
| `proxy.ts` | core* | Check ottimistico del cookie su `PROTECTED_PREFIXES` (*se esiste già, unisci la logica) |
| `app/api/auth/[...all]/route.ts` | core | Handler di Better Auth |
| `app/auth/continue/route.ts` | core | Smistamento post-login: callbackUrl valido oppure `landingForRole()` |
| `app/auth/layout.tsx` | adatta | Layout centrato delle pagine auth |
| `app/auth/login/*` | core | Login email + pulsanti provider |
| `app/auth/register/*` | core | Registrazione |
| `app/auth/forgot-password/page.tsx` | core | Richiesta link di reset |
| `app/auth/reset-password/*` | core | Nuova password da link email |
| `app/auth/verify-email/*` | core | "Controlla la posta" + reinvio link |
| `app/auth/error/page.tsx` | core | Errori OAuth/OIDC e link non validi |
| `app/user/change-password/*` | core | Cambio password (o "imposta password" per utenti solo OAuth) |

## Componenti (`components/auth/`)

| File | Tipo | Ruolo |
|---|---|---|
| `AuthGate.tsx` | core | Server component: protegge una pagina (redirect / pending / denied) |
| `PasswordInput.tsx` | core | Input con mostra/nascondi |
| `ProviderButtons.tsx` | core | Pulsanti Google / OIDC (solo i provider configurati) |
| `UserMenu.tsx`, `SignOutButton.tsx` | core | Menu utente e logout |
| `PendingApproval.tsx`, `AccessDenied.tsx` | adatta | Messaggi per ruoli pending / non autorizzati |
| `ui.tsx` | adatta | Classi Tailwind e `AuthCard` / `FormMessage` (sostituiscile con il design system del progetto) |

## Database

| File | Tipo | Ruolo |
|---|---|---|
| `prisma/schema.prisma` | **adatta** | Copia il blocco `BETTER AUTH CORE` (User, Session, Account, Verification, RateLimit) nello schema del progetto; aggiungi i tuoi campi nel blocco `APP FIELDS` |
| `prisma/seed.ts` | adatta | Crea un ADMIN email+password |

## Config e doc

| File | Tipo | Ruolo |
|---|---|---|
| `.env.example` | core | Tutte le variabili, commentate |
| `INTEGRATION.md` | riferimento | Guida di adozione e setup esterni |
| `docs/AUTHORIZATION_MATRIX.md` | adatta | Template della matrice di autorizzazione |
| `scripts/unit/*.test.ts` | core | Unit test di redirect, password policy, ruoli |
| `scripts/smoke.ts` | adatta | Smoke test HTTP end-to-end (usa le rotte demo `/api/demo/*`) |
| `test/manual-test-plan.md` | adatta | Piano di test manuale (browser, provider reali, email reali) |

## Solo demo

`app/page.tsx`, `app/dashboard/`, `app/admin/`, `app/api/demo/`, `components/demo/SiteHeader.tsx`, `docker-compose.yml`.

## Dipendenze

```bash
npm i better-auth@~1.7.7 @better-auth/prisma-adapter@~1.7.7 zod server-only
```

(Prisma 6, Next 16, React 19 e Tailwind v4 sono già presenti nei progetti tipo.)
