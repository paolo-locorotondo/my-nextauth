# my-nextauth

Template di autenticazione **da copiare** nei nuovi progetti Next.js, basato su [Better Auth](https://www.better-auth.com) 1.7.

- Email e password con **verifica email** obbligatoria, **reset** e **cambio password**
- **Google** e un provider **OIDC generico** (IBM w3id, Keycloak, Entra…), attivi solo se configurati
- Collegamento automatico degli account con la stessa email (solo se l'email locale è verificata)
- **Ruoli** (NUOVO in attesa di approvazione / USER / ADMIN) letti dal DB a ogni richiesta
- **White list di email** (opzionale, `AUTH_ALLOWLIST=on`): registrazione e login limitati a email o domini gestiti da `/admin/allowed-emails`
- Protezione da open redirect, password policy lato server, rate limit su DB, email inviate in background
- Testi in italiano centralizzati in `lib/auth/texts.ts`

Stack: Next 16.4 (`proxy.ts`), React 19.2, Better Auth 1.7, Tailwind v4, Prisma 6.19 + Postgres 16, zod 4, Playwright 1.64 (test E2E).

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

### Cosa succede, caso per caso

| Situazione | Risposta all'utente | Email inviata (in dev: console + `.dev-mailbox.jsonl`) |
|---|---|---|
| Registrazione con email **nuova** | pagina "Verifica la tua email" | **Conferma il tuo indirizzo email**: link di verifica |
| Registrazione con email **già registrata** (anche solo con Google) | **la stessa** pagina "Verifica la tua email", nessun errore | **Hai già un account**: link al login e a "imposta/reimposta password". Nessun nuovo account creato |
| Login con email non verificata | errore 403 "Devi verificare la tua email" + link per reinviare | **un nuovo link di verifica** (parte da solo, vedi sotto) |
| Click sul link di verifica | login automatico, poi `/auth/continue` → callbackUrl o pagina del ruolo | — |
| Link manomesso o scaduto | pagina "Verifica la tua email" con "link non valido o scaduto" e pulsante "Invia di nuovo" | (al click) nuovo link |

Perché nel secondo caso non compare un errore "email già registrata"? È la protezione contro l'**enumerazione degli utenti**: dalla risposta nessuno deve poter capire se un'email ha già un account. L'informazione arriva solo al titolare della casella, via email.

Le email partono **dopo** la risposta HTTP (in background), quindi in console compaiono qualche istante dopo il redirect.

### Il link di verifica non vive nel database

Il link contiene un **token firmato (JWT) con `BETTER_AUTH_SECRET`**: dentro ci sono l'email e la scadenza, e nient'altro viene salvato. Di conseguenza:

- **Non c'è nessuna riga nella tabella `verification`** per la verifica email. Dopo una registrazione la tabella è vuota.
- **Scade dopo 1 ora**, ma il controllo è solo sulla firma e sulla data: non c'è nulla da cancellare né da pulire.
- **Il link non è monouso.** Cliccarlo più volte non dà errore, perché non esiste uno stato "usato" da consultare. Dopo la prima volta l'utente risulta già verificato e il click ripetuto non cambia niente: Better Auth lo manda alla `callbackURL` e, se nel browser non c'è una sessione valida, `/auth/continue` lo rimanda al login. Un link "già usato" funziona quindi ma non fa mai danni, e non è un difetto.
- **Ogni richiesta emette un link nuovo, e tutti restano validi** fino alla loro scadenza: un link nuovo non revoca quelli vecchi.
- I link non validi sono solo quelli **manomessi** (firma sbagliata → `INVALID_TOKEN`) o **scaduti** (`TOKEN_EXPIRED`).
- Cambiare `BETTER_AUTH_SECRET` invalida tutti i link in circolazione (e tutte le sessioni).

### Il reinvio automatico al login

Con `sendOnSignIn: true` (impostato in `lib/auth/server.ts`), quando un utente non verificato fa login con la password **giusta**, Better Auth risponde 403 e in più invia un nuovo link. Parte solo se la password è corretta: con una password sbagliata si ottiene "Email o password non corretti" e nessuna email, così nessuno può far partire email verso un indirizzo altrui.

Il link reinviato punta alla `callbackURL` della richiesta di login. La UI la passa sempre; chi chiama l'API a mano deve passarla, altrimenti il link porta a `/`.

### La tabella `verification`: a cosa serve davvero

Serve per i token **che hanno stato** e che devono essere monouso. Ogni riga ha un `identifier` col tipo, un `value` e una scadenza (`expiresAt`):

| `identifier` | Creata quando | `value` | Scade | Cancellata |
|---|---|---|---|---|
| `reset-password:<token>` | "Password dimenticata" per un'email registrata | l'`id` dell'utente | dopo 1 ora | al primo uso valido di `/reset-password` |
| `auth-state:<state>` | Clic su "Accedi con Google/SSO" | dati temporanei del login OAuth (anti-CSRF, PKCE) | dopo 10 minuti | al ritorno dal provider |
| `delete-account-<token>` | solo se abiliti la cancellazione account (qui non attiva) | — | — | — |

Ciclo di una riga di reset (verificato sul codice reale):

1. **Richiesta** → una riga `reset-password:…`, scadenza tra 60 minuti. Se l'email non esiste non si crea niente e la risposta è identica (anti-enumerazione).
2. **Clic sul link** (`GET`) → la riga **resta**: il clic legge soltanto e rimanda a `/auth/reset-password?token=…`. Aprire il link non lo consuma.
3. **Invio del modulo** (`POST /reset-password`) → la riga viene **consumata e cancellata** in modo atomico: un secondo uso dello stesso token risponde `400 INVALID_TOKEN`. Cancellare la riga invalida anche gli eventuali altri token pendenti dello stesso identifier.
4. **Se nessuno lo usa** → resta nella tabella oltre la scadenza (una riga scaduta non è usabile: è ignorata al controllo).

### Pulizia delle righe scadute

Better Auth non ha un job di pulizia. Cancella le righe scadute **in modo pigro**, ogni volta che legge la tabella (per esempio a ogni richiesta di reset, anche per un'email inesistente). In un'app con traffico basso la tabella può quindi tenere righe scadute per un po'; è innocuo, perché sono comunque non usabili.

Se vuoi una pulizia esplicita, per esempio con un cron, basta questa query:

```sql
DELETE FROM verification WHERE "expiresAt" < now();
```

Altre due cose da sapere:

- `verification` **non ha chiavi esterne** verso `user`: cancellando un utente i suoi token di reset pendenti non cadono da soli. Il pulsante "Elimina" di `/admin/users` li toglie (`lib/auth/delete-user.ts`); se cancelli un utente a mano da Adminer, pulisci anche `DELETE FROM verification WHERE value = '<id utente>'`.
- `session` e `account` invece hanno `ON DELETE CASCADE`: spariscono con l'utente.

## Ripulire il database per ripetere i test

Tre livelli, dal meno al più invasivo. Tutti i comandi sono per **PowerShell**, dalla cartella del progetto, con Docker acceso e i container su (`npm run db:up`).

**1. Solo gli utenti di prova, tenendo l'ADMIN di seed**

```powershell
docker exec auth-postgres psql -U auth -d my_nextauth -c "DELETE FROM \"user\" WHERE email <> 'admin@example.com';"
```

`session` e `account` spariscono a cascata. Se usi una email diversa per l'admin, cambiala nel comando. In alternativa usa il pulsante **Elimina** di `/admin/users`, che toglie anche i token di reset pendenti.

**2. Svuotare anche i contatori e i token (consigliato tra due giri di test)**

```powershell
docker exec auth-postgres psql -U auth -d my_nextauth -c "TRUNCATE \"user\", verification, \"rateLimit\" CASCADE;"
npm run db:seed
```

`TRUNCATE ... CASCADE` svuota `user`, `account`, `session`, `verification` e `rateLimit`. Il rate limit di un giro di test, se non azzerato, può dare un 429 a quello dopo. **Non** tocca `allowed_email` (la white list resta): per svuotare anche quella aggiungi `allowed_email` all'elenco. Il seed ricrea l'ADMIN.

**3. Ripartire da zero (distrugge tutto, anche lo schema)**

```powershell
docker compose down -v
npm run db:up
npx prisma migrate deploy
npm run db:seed
```

`down -v` cancella il volume del database. Poi `migrate deploy` riapplica le migration esistenti senza crearne di nuove.

Per pulire anche le email di prova: cancella `.dev-mailbox.jsonl` (è solo un file di log locale, ignorato da git).

> Non eseguire questi comandi su un database di produzione.

## Script

| Comando | Cosa fa |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit test (redirect sicuri, password policy, ruoli, white list) |
| `npm run test:config` | Avvio con env sbagliate e provider email (non serve il server) |
| `npm run test:db` | Test su DB reale (eliminazione utente) |
| `npm run test:http` | Test di sicurezza HTTP contro l'app avviata |
| `npm run smoke` | Test end-to-end HTTP contro l'app avviata (vedi sotto) |
| `npm run test:e2e` | Test nel browser (Playwright): avvia da sé il server sulla porta 3100 |
| `npm run db:up` / `db:migrate` / `db:seed` | Postgres in Docker, migration, seed |

### Test E2E nel browser

```bash
npx playwright install chromium   # una volta sola
npm run test:e2e                  # tutti i profili
npm run test:e2e -- b-register    # un solo file
```

Servono Postgres acceso e seed eseguito (`npm run db:up`, `npm run db:seed`). Non serve avviare il server e non tocca quello sulla porta 3000. Dettagli e profili in [test/README.md](test/README.md); quali test manuali sono coperti in [test/coverage-map.md](test/coverage-map.md).

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
| `/admin/users` | ADMIN: elenco utenti e cambio ruolo (`/admin` rimanda qui) |
| `/user/change-password` | qualsiasi utente loggato |
| `/api/demo/me`, `/api/demo/admin` | esempi di route handler protetti |

## Usarlo in un progetto

1. [MANIFEST.md](MANIFEST.md): quali file copiare.
2. [INTEGRATION.md](INTEGRATION.md): checklist di adozione, setup di Google Cloud, OIDC, email (Resend/SendGrid e DNS), protezione delle rotte, sicurezza, troubleshooting.
3. [docs/AUTHORIZATION_MATRIX.md](docs/AUTHORIZATION_MATRIX.md): template della matrice ruoli × rotte.
4. [test/manual-test-plan.md](test/manual-test-plan.md): test manuali per dichiarare il template funzionante.
