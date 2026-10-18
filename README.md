# my-nextauth

Template di autenticazione **da copiare** nei nuovi progetti Next.js, basato su [Better Auth](https://www.better-auth.com) 1.7.

- Email e password con **verifica email** obbligatoria, **reset** e **cambio password**
- **Google** e un provider **OIDC generico** (IBM w3id, Keycloak, Entra…), attivi solo se configurati
- Collegamento automatico degli account con la stessa email (solo se l'email locale è verificata)
- **Ruoli** (NUOVO in attesa di approvazione / USER / ADMIN) letti dal DB a ogni richiesta
- **White list di email** (opzionale, `AUTH_ALLOWLIST=on`): registrazione e login limitati a email o domini gestiti da `/admin/allowed-emails`
- Protezione da open redirect, password policy lato server, rate limit su DB, email inviate in background
- Testi in italiano centralizzati in `lib/auth/texts.ts`

Stack: Next 16.2 (`proxy.ts`), React 19, Tailwind v4, Prisma 6 + Postgres, zod 4.

## Avvio rapido (demo)

Requisiti: Node ≥ 20.9, Docker.

```bash
npm install
cp .env.example .env          # poi genera BETTER_AUTH_SECRET: `openssl rand -base64 32` oppure `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
npm run db:up                 # Postgres su localhost:5434
npx prisma migrate dev        # crea le tabelle
npm run db:seed               # ADMIN: admin@example.com / Admin123!
npm run dev                   # http://localhost:3000
```

In sviluppo le email non partono: sono stampate in console e salvate in `.dev-mailbox.jsonl` (adapter `console`). Apri il link da lì per verificare l'account o reimpostare la password.

Adminer (interfaccia web del DB) è su http://localhost:8080: sistema *PostgreSQL*, server `postgres`, credenziali `POSTGRES_*` del `.env`.

## Come funziona la verifica email

Un account email+password non può accedere finché l'indirizzo non è verificato (`requireEmailVerification`). Google e OIDC restituiscono email già verificate dal provider e non passano da qui.

| Situazione | Risposta all'utente | Email inviata (in dev: console + `.dev-mailbox.jsonl`) |
|---|---|---|
| Registrazione con email **nuova** | pagina "Verifica la tua email" | **Conferma il tuo indirizzo email**: link di verifica |
| Registrazione con email **già registrata** (anche solo con Google) | **la stessa** pagina "Verifica la tua email", nessun errore | **Hai già un account**: link al login e a "imposta/reimposta password". Nessun nuovo account creato |
| Login con email non verificata | errore 403 "Devi verificare la tua email" + link per reinviare | nuovo link di verifica |
| Click sul link di verifica | login automatico, poi `/auth/continue` → callbackUrl o pagina del ruolo | — |
| Link scaduto o non valido | pagina "Verifica la tua email" con pulsante "Invia di nuovo" | (al click) nuovo link |

Perché nel secondo caso non compare un errore "email già registrata"? È la protezione contro l'**enumerazione degli utenti**: dalla risposta nessuno deve poter capire se un'email ha già un account. L'informazione arriva solo al titolare della casella, via email.

Le email partono **dopo** la risposta HTTP (in background), quindi in console compaiono qualche istante dopo il redirect. Il link di verifica scade dopo 1 ora (default di Better Auth). Un utente solo Google che vuole anche una password usa "Password dimenticata": il reset crea la credenziale mancante.

## Script

| Comando | Cosa fa |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit test (redirect sicuri, password policy, ruoli) |
| `npm run smoke` | Test end-to-end HTTP contro l'app avviata (vedi sotto) |
| `npm run db:up` / `db:migrate` / `db:seed` | Postgres in Docker, migration, seed |

### Smoke test

```bash
AUTH_RATE_LIMIT=on npm run dev    # terminale 1 (rate limit attivo anche in dev)
npm run smoke                     # terminale 2
```

Verifica, tra le altre cose: home pubblica, redirect al login con `callbackUrl`, atterraggio per ruolo, registrazione con password debole (400), registrazione con email esistente (stessa risposta + email "hai già un account"), login prima della verifica (403), auto sign-in dal link di verifica, cambio di ruolo con effetto immediato, rifiuto dei `callbackURL` esterni, reset password con revoca delle sessioni, cambio password, 429 alla sesta sign-in, logout.

## Pagine della demo

| Path | Accesso |
|---|---|
| `/` | pubblica |
| `/auth/*` | login, registrazione, password dimenticata, reset, verifica email, errori |
| `/dashboard` | utenti approvati (NUOVO vede "in attesa di approvazione") |
| `/admin` | ADMIN: elenco utenti e cambio ruolo |
| `/user/change-password` | qualsiasi utente loggato |
| `/api/demo/me`, `/api/demo/admin` | esempi di route handler protetti |

## Usarlo in un progetto

1. [MANIFEST.md](MANIFEST.md): quali file copiare.
2. [INTEGRATION.md](INTEGRATION.md): checklist di adozione, setup di Google Cloud, OIDC, email (Resend/SendGrid e DNS), protezione delle rotte, sicurezza, troubleshooting.
3. [docs/AUTHORIZATION_MATRIX.md](docs/AUTHORIZATION_MATRIX.md): template della matrice ruoli × rotte.
4. [test/manual-test-plan.md](test/manual-test-plan.md): test manuali per dichiarare il template funzionante.
