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
| `lib/auth/delete-user.ts` | core | `deleteUserAndData()`: elimina un utente con i token di reset pendenti (la tabella `verification` non ha FK verso `user`) |
| `lib/auth/allowlist-rules.ts` | core | Regole pure della white list (email e domini), testabili senza DB |
| `lib/auth/allowlist.ts` | core | `isEmailAllowed()`: il controllo sul DB, usato dagli hook in `server.ts` |
| `docs/SITEMAP.md` | adatta | Albero delle pagine con i ruoli; si aggiorna a ogni nuova pagina, insieme ad AUTHORIZATION_MATRIX |
| `app/admin/users/*`, `app/admin/page.tsx` | adatta | Elenco utenti, cambio ruolo, eliminazione (`/admin/users`); `/admin` fa solo redirect (solo demo: adatta al tuo pannello admin) |
| `app/admin/allowed-emails/*` | adatta | Pagina e server action per gestire la white list (solo demo: adatta al tuo pannello admin) |
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
| `UserMenu.tsx`, `SignOutButton.tsx` | core | Menu utente a tendina (client component) e logout |
| `../demo/MenuSezioni.tsx` | demo | Hamburger (telefono) e voci in linea con sottovoci (desktop) usati da `components/demo/SiteHeader.tsx` |
| `PendingApproval.tsx`, `AccessDenied.tsx` | adatta | Messaggi per ruoli pending / non autorizzati |
| `ui.tsx` | adatta | Classi Tailwind, `AuthCard` / `FormMessage` e gli elementi condivisi `DeleteButton`, `selectClass`, `selectTabellaClass` (sostituiscili con il design system del progetto). Resta nel core: serve anche dopo la rimozione della demo |

## Database

| File | Tipo | Ruolo |
|---|---|---|
| `prisma/schema.prisma` | **adatta** | Copia il blocco `BETTER AUTH CORE` (User, Session, Account, Verification, RateLimit) nello schema del progetto; aggiungi i tuoi campi nel blocco `APP FIELDS` |
| `prisma/seed.ts` | adatta | Crea un ADMIN email+password |

## Config e doc

| File | Tipo | Ruolo |
|---|---|---|
| `app/globals.css` | adatta | Due regole da copiare nel CSS globale del progetto: cursore a mano sui pulsanti (`@layer base`) e `.select-custom` (freccia dei select, usata da `selectClass` / `selectTabellaClass`) |
| `.env.example` | core | Tutte le variabili, commentate |
| `INTEGRATION.md` | riferimento | Guida di adozione e setup esterni |
| `docs/AUTHORIZATION_MATRIX.md` | adatta | Template della matrice di autorizzazione |
| `test/unit/*.test.ts` | core | Unit test di redirect, password policy, ruoli |
| `test/helpers/http.ts` | core | Client HTTP con cookie jar e lettura email di sviluppo, condivisi da smoke e test HTTP |
| `test/http/*.test.ts` | core | Test di sicurezza HTTP contro l'app in esecuzione (header, CSRF, ruolo, anti-enumerazione) |
| `test/db/*.test.ts` | core | Test su DB reale (eliminazione utente) |
| `test/config/*.test.ts` | core | Test di avvio con env sbagliate e provider email (processo figlio) |
| `test/e2e/*.spec.ts`, `playwright.config.ts` | core | Test nel browser con Playwright: il test avvia da sé il server di sviluppo (porta 3100) in tre profili di env |
| `test/tools/run-e2e.mjs` | core | Lancia i profili E2E uno dopo l'altro |
| `test/coverage-map.md` | adatta | Mappa test manuali ↔ automatici |
| `test/tools/check-secrets.mjs` | core | Dopo `npm run build`: verifica che il valore dei segreti di `.env` non compaia nei file serviti al browser |
| `test/smoke/smoke.ts` | adatta | Smoke test HTTP end-to-end (usa le rotte demo `/api/demo/*`) |
| `test/manual-test-plan.md` | adatta | Piano di test manuale (browser, provider reali, email reali) |

## Solo demo

`app/page.tsx`, `app/dashboard/`, `app/admin/`, `app/api/demo/`, `components/demo/SiteHeader.tsx`, `components/demo/MenuSezioni.tsx`, `docker-compose.yml`.

## Dipendenze

```bash
npm i better-auth@~1.7.7 @better-auth/prisma-adapter@~1.7.7 zod server-only
```

(Prisma 6, Next 16, React 19 e Tailwind v4 sono già presenti nei progetti tipo.)
