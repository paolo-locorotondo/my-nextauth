# INTEGRATION: adottare il template in un nuovo progetto

Guida per chi copia my-nextauth in un nuovo progetto Next.js 16. Riferimento API: Better Auth **1.7.7**.

## Indice

1. [Checklist di adozione](#1-checklist-di-adozione)
2. [Variabili d'ambiente](#2-variabili-dambiente)
3. [Copia dei file e dipendenze](#3-copia-dei-file-e-dipendenze)
4. [Schema Prisma e campi del progetto](#4-schema-prisma-e-campi-del-progetto)
5. [Google: setup su Google Cloud](#5-google-setup-su-google-cloud)
6. [Provider OIDC generico (es. IBM w3id)](#6-provider-oidc-generico-es-ibm-w3id)
7. [Email: Resend o SendGrid](#7-email-resend-o-sendgrid)
8. [Proteggere le rotte: quale helper dove](#8-proteggere-le-rotte-quale-helper-dove)
9. [Ruoli](#9-ruoli)
10. [Flusso di login e redirect](#10-flusso-di-login-e-redirect)
11. [Note di sicurezza](#11-note-di-sicurezza)
12. [Troubleshooting](#12-troubleshooting)
13. [Opzionale: backend esterno (JWT + JWKS)](#13-opzionale-backend-esterno-jwt--jwks)
14. [Opzionale: plugin admin di Better Auth](#14-opzionale-plugin-admin-di-better-auth)
15. [Note di migrazione da next-auth v4](#15-note-di-migrazione-da-next-auth-v4)
16. [White list di email (AUTH_ALLOWLIST)](#16-white-list-di-email-auth_allowlist)
17. [Rate limit: finestre e come cambiarle](#17-rate-limit-finestre-e-come-cambiarle)
18. [`BETTER_AUTH_URL` e `TRUSTED_ORIGINS`](#18-better_auth_url-e-trusted_origins-a-cosa-servono-e-come-impostarle)

---

## 1. Checklist di adozione

- [ ] Copia i file indicati in [MANIFEST.md](MANIFEST.md) e installa le dipendenze (§3).
- [ ] Adatta `lib/auth/config.ts`: `ROLES`, `DEFAULT_ROLE`, `PENDING_ROLES`, `ADMIN_ROLES`, `landingForRole()`, `PROTECTED_PREFIXES`, `PASSWORD_POLICY`.
- [ ] Allinea il `@default` di `User.role` nello schema Prisma a `DEFAULT_ROLE`.
- [ ] Unisci il blocco `BETTER AUTH CORE` nel tuo `schema.prisma` e lancia `npx prisma migrate dev` (§4).
- [ ] Genera un `BETTER_AUTH_SECRET` **nuovo** per ogni progetto e per ogni ambiente: `openssl rand -base64 32` oppure `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- [ ] Imposta `BETTER_AUTH_URL` con l'URL pubblico esatto (schema + host, senza slash finale).
- [ ] Imposta `AUTH_ADMIN_EMAILS` per il primo amministratore, oppure usa `prisma/seed.ts`.
- [ ] Google: registra i redirect URI di questo progetto sul client OAuth (§5).
- [ ] OIDC (se serve): registra il redirect URI presso l'identity provider (§6).
- [ ] Email di produzione: account Resend/SendGrid, API key, DNS del dominio, `EMAIL_FROM` (§7).
- [ ] Proteggi ogni pagina, route handler e server action con gli helper (§8). Il proxy da solo **non basta**.
- [ ] Aggiorna `docs/AUTHORIZATION_MATRIX.md`.
- [ ] Lancia `npm test` e `npm run smoke` (se tieni le rotte demo) prima del primo deploy.

## 2. Variabili d'ambiente

Tutte sono documentate in [.env.example](.env.example). Le più importanti:

| Variabile | Obbligatoria | Note |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | sì | `DIRECT_URL` = connessione senza pooler, per le migration |
| `BETTER_AUTH_SECRET` | sì (prod) | Minimo 32 caratteri. In produzione l'app non parte senza |
| `BETTER_AUTH_URL` | sì (prod) | Base per i link email e i redirect OAuth |
| `TRUSTED_ORIGINS` | no | Altre origini accettate (es. `https://www.dominio.it`, deploy di preview) |
| `AUTH_ADMIN_EMAILS` | no | Email che diventano ADMIN **alla creazione** dell'utente |
| `AUTH_ALLOWLIST` | no | `on` limita registrazione e login alla white list di `/admin/allowed-emails` (§16) |
| `AUTH_RATE_LIMIT` | no | `on` per attivare il rate limit in dev (in prod è sempre attivo) |
| `AUTH_IP_HEADERS` | no | Header da cui leggere l'IP del client (default `x-forwarded-for`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Se vuote, il pulsante Google non compare |
| `OIDC_*` | no | Attivo solo con ID, DISCOVERY_URL, CLIENT_ID e CLIENT_SECRET valorizzati |
| `EMAIL_PROVIDER` | sì (prod) | `console` (default in dev), `resend`, `sendgrid` |
| `EMAIL_FROM` | sì (prod) | Es. `My App <noreply@tuodominio.it>`. Il dominio deve essere verificato sul provider |

## 3. Copia dei file e dipendenze

```bash
npm i better-auth@~1.7.7 @better-auth/prisma-adapter@~1.7.7 zod server-only
```

- Se il progetto ha già un `PrismaClient` singleton, non copiare `lib/db.ts` e aggiorna l'import in `lib/auth/server.ts`.
- Se il progetto ha già un `proxy.ts` (o `middleware.ts` di Next ≤ 15), unisci la logica: basta chiamare `getSessionCookie(request)` sui prefissi protetti.
- I componenti usano classi Tailwind v4. Per adattarli al design system del progetto modifica `components/auth/ui.tsx`.
- `npm run typecheck` esegue prima `next typegen`, che genera i tipi globali `PageProps` usati dalle pagine.

## 4. Schema Prisma e campi del progetto

Il blocco `BETTER AUTH CORE` di [prisma/schema.prisma](prisma/schema.prisma) contiene i modelli richiesti da Better Auth: `User`, `Session`, `Account`, `Verification`, `RateLimit`. **Non rinominare né rimuovere i campi.** I nomi delle tabelle (`@@map`) sono quelli predefiniti da Better Auth.

I campi specifici del progetto vanno nel blocco `APP FIELDS` del model `User`:

```prisma
model User {
  // ... campi core ...
  role String @default("NUOVO")

  // ── APP FIELDS ──
  phoneNumber String?
  orders      Order[]
}
```

- I campi aggiunti **solo in Prisma** sono invisibili a Better Auth: non compaiono in `session.user` e non si possono impostare in fase di registrazione. Va bene per relazioni e dati applicativi.
- Se un campo deve stare nella sessione, dichiaralo anche in `user.additionalFields` di `lib/auth/server.ts`, come `role`. Usa `input: false` se l'utente non deve poterlo impostare da solo.
- Dopo aver cambiato plugin o `additionalFields`, verifica lo schema con la CLI: `npx auth@latest generate --config lib/auth/server.ts --output /tmp/schema.prisma` (scrivi su un file temporaneo e confronta). La CLI richiede **Node ≥ 20.19**.
- Il password hash sta in `Account.password` (`providerId = "credential"`), non nello `User`.

## 5. Google: setup su Google Cloud

> Non basta copiare client ID e secret da un altro progetto: i **redirect URI autorizzati** appartengono al singolo client OAuth. Ogni progetto deve registrare i propri.

**Consigliato: un client OAuth per progetto.** Così consent screen, logo e secret restano separati. In alternativa puoi aggiungere gli URI del nuovo progetto a un client condiviso, ma gli utenti vedranno il nome di quell'app.

1. Vai su [console.cloud.google.com](https://console.cloud.google.com) e crea un progetto (o selezionane uno).
2. Apri **Google Auth Platform** (ex "Schermata consenso OAuth").
   - **Branding**: nome dell'app, email di supporto, logo (facoltativo, ma richiede la verifica del brand), dominio autorizzato (es. `tuodominio.it`), link a privacy e termini.
   - **Pubblico (Audience)**: tipo *Esterno*. Poi premi **Pubblica app** e porta lo stato su **In produzione**. In *Testing* possono accedere solo gli utenti di test elencati.
   - **Accesso ai dati**: bastano gli scope `openid`, `email` e `profile`. Non sono sensibili e non richiedono la verifica di Google.
3. **Client → Crea client**, tipo **Applicazione web**:
   - **Origini JavaScript autorizzate**: `http://localhost:3000` e `https://tuodominio.it`
   - **URI di reindirizzamento autorizzati**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://tuodominio.it/api/auth/callback/google`
     - (eventuali domini di preview o staging, uno per uno: Google non accetta wildcard)
4. Copia **Client ID** e **Client secret** in `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Salva subito il secret: in seguito la console potrebbe non mostrarlo più.
5. Le modifiche agli URI possono impiegare da qualche minuto a qualche ora per propagarsi.

Il template chiede `prompt: "select_account"`, così l'utente sceglie sempre l'account Google. Un nuovo utente Google riceve `DEFAULT_ROLE` (NUOVO) ed è già verificato.

## 6. Provider OIDC generico (es. IBM w3id)

Usa il plugin `genericOAuth` con discovery automatica. Qualsiasi provider OIDC standard va bene (IBM w3id, Keycloak, Microsoft Entra, Okta, Auth0…).

1. Presso l'identity provider registra un'applicazione **web / confidential client** con:
   - redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/{OIDC_PROVIDER_ID}`. In 1.7 il plugin usa l'endpoint core `callback/:id`. Esempio: `https://tuodominio.it/api/auth/callback/ibm`
   - grant type: authorization code, con PKCE abilitato (il template lo usa)
   - scope: `openid profile email`
2. Imposta le env:

   ```dotenv
   OIDC_PROVIDER_ID="ibm"                 # minuscole, numeri, trattini: compare nell'URL
   OIDC_LABEL="IBM w3id"                  # testo del pulsante: "Accedi con IBM w3id"
   OIDC_DISCOVERY_URL="https://<issuer>/.well-known/openid-configuration"
   OIDC_CLIENT_ID="..."
   OIDC_CLIENT_SECRET="..."
   OIDC_SCOPES="openid profile email"
   ```

   Per IBM w3id usa l'URL di discovery dell'ambiente (preprod o prod) indicato nella registrazione dell'applicazione su SSO Provisioner.
3. Lato client il provider si avvia con `authClient.signIn.social({ provider: "<OIDC_PROVIDER_ID>" })` (vedi `ProviderButtons.tsx`). Non esistono `signIn.oauth2` né un `genericOAuthClient`.
4. Il provider deve restituire il claim `email`, altrimenti il login fallisce con `email_not_found`.
5. Il provider è tra i `trustedProviders` dell'account linking: un utente con la stessa email (verificata) viene collegato al proprio account esistente.

## 7. Email: Resend o SendGrid

Le email di verifica e reset partono **dopo la risposta HTTP** (`advanced.backgroundTasks` → `after()` di Next). Gli errori di invio vengono loggati, non mostrati: la risposta resta identica che l'utente esista o no.

**Conseguenza da tenere presente:** se l'invio fallisce (provider non configurato, chiave errata, dominio non verificato, destinatario rifiutato), l'utente vede comunque "Verifica la tua email" e **l'unica traccia è nel log del server**: `[auth] invio email "verify" a … fallito: …`. In produzione monitora quei log (o un allarme sulla stringa `[auth] invio email`). Non è un difetto: mostrare l'errore a video farebbe capire a un attaccante quali email esistono.

### Sviluppo

Non serve nessuna configurazione esterna. Con `EMAIL_PROVIDER=console` (default fuori produzione) ogni email viene stampata in console e accodata a `.dev-mailbox.jsonl` (ignorato da git).

### Resend (consigliato)

Il free tier è permanente: 3.000 email al mese, 100 al giorno, fino a 3 domini.

> **Serve un dominio che possiedi.** Resend invia da un dominio tuo e lo verifica leggendo il suo DNS: quindi devi poter aggiungere record al DNS di quel dominio. Un dominio inventato o di un altro (es. `my-nextauth.it` se non è registrato a tuo nome) non si verifica mai: errori tipici *"Domain not found in any DNS servers"* e *"All required records are missing"*. Se non ne hai uno, compralo da un registrar (Cloudflare, Namecheap, Aruba, Register.it…): un `.it` costa pochi euro l'anno.
>
> **Senza dominio** (piano gratuito, nessun acquisto) puoi provare Resend solo così:
>
> - mittente `EMAIL_FROM="My App <onboarding@resend.dev>"`, che Resend fornisce per i test;
> - destinatario **solo l'email con cui ti sei registrato su Resend**. Qualsiasi altro indirizzo, anche `@example.com`, riceve un errore 403 (o 422 per `@example.com`), e nel log del server compare `[auth] invio email … fallito`.
>
> Cosa puoi verificare così: che la chiave API e la configurazione funzionano, che la mail di verifica o reset arriva davvero in casella, che il link funziona. Cosa **non** puoi verificare: invii verso altri utenti, il caso "Hai già un account" per un secondo utente, e i controlli SPF/DKIM/DMARC del tuo dominio (il mittente è di Resend).
>
> Procedura: nel `.env` imposta `EMAIL_PROVIDER="resend"`, `RESEND_API_KEY` e `EMAIL_FROM` come sopra; riavvia il dev server (le variabili si leggono all'avvio); registra o richiedi un reset **con l'email dell'account Resend** (se l'utente esiste già, eliminalo prima da `/admin`); controlla la casella, anche lo spam. Per tornare ai test normali rimetti `EMAIL_PROVIDER="console"`.
>
> Per l'uso reale serve un dominio tuo: vedi sopra, "Serve un dominio che possiedi".
>
> **Destinatari di prova:** Resend rifiuta (422) qualsiasi indirizzo `@example.com` o `@test.com`. Per i test usa una casella reale tua oppure `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`. Gli utenti di prova con `@example.com` funzionano solo con `EMAIL_PROVIDER="console"`.

1. Crea un account su [resend.com](https://resend.com).
2. **Domains → Add Domain**: inserisci un **sottodominio del tuo dominio** dedicato alle email transazionali (es. `mail.tuodominio.it`), consigliato da Resend per tenere separata la reputazione dal dominio principale.
3. Resend mostra la tabella *Records* con i record DNS da aggiungere. Copiali **identici** (copia e incolla) nel pannello DNS **di chi gestisce davvero i nameserver del dominio** (di solito il registrar, o Cloudflare se l'hai spostato lì). Se compaiono dei CNAME e usi Cloudflare, la nuvola deve essere **grigia** (*DNS only*): con il proxy arancione la verifica non si completa.
   - **DKIM**: record TXT `resend._domainkey…`
   - **SPF**: record MX e TXT (`v=spf1 include:…`) sul sottodominio di invio
   - **DMARC** (consigliato): TXT su `_dmarc.tuodominio.it`, per iniziare `v=DMARC1; p=none; rua=mailto:dmarc@tuodominio.it`. Quando i report sono puliti passa a `p=quarantine`.
4. Premi **Verify**. Spesso basta un quarto d'ora; la propagazione DNS può richiedere fino a 72 ore. Se resta in errore, usa *Restart verification*. Per controllare da fuori che i record siano pubblici: `nslookup -type=TXT resend._domainkey.mail.tuodominio.it` oppure [dns.email](https://dns.email).
5. **API Keys → Create API Key** con permesso **Sending access**, limitato al dominio. Non usare *Full access*.
6. Env:

   ```dotenv
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_..."
   EMAIL_FROM="My App <noreply@mail.tuodominio.it>"
   ```

### SendGrid (alternativa)

Non ha più un piano gratuito permanente, solo un periodo di prova.

1. Account su [sendgrid.com](https://sendgrid.com).
2. **Settings → Sender Authentication → Authenticate Your Domain**: SendGrid genera 3 record **CNAME** (`em…`, `s1._domainkey`, `s2._domainkey`) per SPF e DKIM. Aggiungili al DNS e verifica. Aggiungi anche il record DMARC come sopra.
3. **Settings → API Keys → Create API Key** → *Restricted Access*, con solo **Mail Send** abilitato.
4. Env: `EMAIL_PROVIDER="sendgrid"`, `SENDGRID_API_KEY="SG...."`, `EMAIL_FROM` su un dominio autenticato.

### Altri provider

Implementa l'interfaccia `EmailSender` (`lib/auth/email/types.ts`) e aggiungi un `case` in `lib/auth/email/index.ts`. I testi delle email sono in `texts.email`, l'HTML in `lib/auth/email/templates.ts`.

## 8. Proteggere le rotte: quale helper dove

Il proxy (`proxy.ts`) fa solo un controllo **ottimistico**: verifica che il cookie di sessione esista, senza interrogare il DB. Serve per la UX (redirect al login con `callbackUrl`), **non per la sicurezza**. Ogni pagina, API e server action deve validare la sessione e il ruolo per conto proprio.

| Dove | Helper | In caso di rifiuto |
|---|---|---|
| Pagina (server component) | `<AuthGate callbackPath="/x" roles="ADMIN">{(user) => …}</AuthGate>` | redirect al login / `PendingApproval` / `AccessDenied` |
| Pagina con logica custom | `requirePageAuth(path, roles?, opts?)` | redirect al login se anonimo, altrimenti restituisce `{ ok, reason }` |
| Server component / action, decide tu | `validateAuthFromServerSession(roles?, opts?)` | `{ ok: false, reason: "unauthenticated" \| "pending" \| "forbidden" }` |
| Server action | `requireRole(roles?, opts?)` | lancia `AuthError` |
| Route handler (`route.ts`) | `validateAuth(request, roles?, opts?)` | `auth.errorResponse` (401 / 403 JSON) |
| UI cosmetica (header, menu) | `getOptionalSession()` | `null` |
| Componenti client | `useSession()` da `lib/auth/client.ts` | solo UI: mai per autorizzare |

- `roles` accetta un ruolo o un array (`"ADMIN"`, `["USER", "ADMIN"]`). Senza ruoli basta essere loggati e non pending.
- `{ allowPending: true }` lascia passare anche i ruoli in `PENDING_ROLES` (es. cambio password, `/api/demo/me`).
- Le **server action** sono endpoint POST raggiungibili direttamente: vanno **sempre** protette con `requireRole`, anche se il bottone che le chiama sta in una pagina protetta.
- Aggiungi i prefissi delle nuove aree in `PROTECTED_PREFIXES`. Il matcher del proxy è volutamente ampio, così la lista da mantenere è una sola.

Esempio di route handler:

```ts
import { validateAuth } from "@/lib/auth/helpers";

export async function GET(request: Request) {
  const auth = await validateAuth(request, "ADMIN");
  if (!auth.ok) return auth.errorResponse;
  // auth.user, auth.session
}
```

## 9. Ruoli

- I ruoli sono stringhe in `ROLES` (`lib/auth/config.ts`), salvate in `User.role`. Usare una stringa invece di un enum Prisma evita migration quando cambi i ruoli.
- Ogni nuovo utente (email, Google, OIDC) riceve `DEFAULT_ROLE`, oppure `ADMIN` se la sua email è in `AUTH_ADMIN_EMAILS` (hook `databaseHooks.user.create.before`). La lista vale **solo alla creazione**: aggiungere un'email in seguito non promuove un utente già esistente.
- Il ruolo è `input: false`: non si può impostare dalla registrazione.
- La sessione viene letta dal DB a ogni richiesta (il `cookieCache` di Better Auth è disattivato), quindi un cambio di ruolo vale **subito**. Se attivi `session.cookieCache` per ridurre le query, accetti che un ruolo revocato resti valido fino alla scadenza della cache.
- Per cambiare ruolo: server action con `requireRole("ADMIN")` + `prisma.user.update` (vedi `app/admin/actions.ts`).

## 10. Flusso di login e redirect

```
pagina protetta ──(proxy, no cookie)──▶ /auth/login?callbackUrl=/pagina
login email / Google / OIDC / link di verifica ──▶ /auth/continue?callbackUrl=/pagina
/auth/continue: callbackUrl valido? ──sì──▶ /pagina
                                     └─no──▶ landingForRole(ruolo)   (ADMIN → /admin, altri → /dashboard)
```

- Tutti i flussi passano `callbackURL = continueUrl(callbackUrl)` a Better Auth. Passalo anche nelle chiamate API custom a `/sign-in/email`: il link di verifica reinviato al login di un utente non verificato (`sendOnSignIn`) usa quel valore (default `/`).
- `safeCallbackUrl()` accetta solo path relativi della stessa origine. Rifiuta URL assoluti, `//host`, backslash, separatori codificati (`%2F`, `%5C`), caratteri di controllo e loop verso `/auth/*`.
- Better Auth valida a sua volta `callbackURL` / `redirectTo` rispetto a `BETTER_AUTH_URL` e `TRUSTED_ORIGINS` (403 se esterni).
- `/` è pubblica: mostra le CTA "Accedi / Registrati" oppure il menu utente.

## 11. Note di sicurezza

- **Account linking**: un login Google/OIDC con un'email già registrata viene collegato all'utente esistente **solo se l'email locale è verificata** (`requireLocalEmailVerified`, default di Better Auth). Questo impedisce il takeover da pre-registrazione: chi registra l'email di un altro senza verificarla non può farsi collegare il suo Google. Se l'email non è verificata, il login OAuth fallisce con `account_not_linked`.
- **Password**: policy applicata lato client e lato server (hook `before` su sign-up, reset e change). L'hash è scrypt (default di Better Auth). Il reset revoca tutte le sessioni, il cambio password revoca le altre (`revokeOtherSessions`).
- **Utenti solo Google/OIDC**: possono impostare una password con "Password dimenticata": `resetPassword` crea l'account `credential` mancante.
- **Enumerazione utenti**: "password dimenticata" risponde sempre allo stesso modo, e le email partono in background con tempi di risposta costanti.
- **Rate limit**: storage su DB (funziona anche su serverless con più istanze). Finestre e limiti nella sezione [17](#17-rate-limit-finestre-e-come-cambiarle). L'IP viene letto da `AUTH_IP_HEADERS`: imposta l'header che il **tuo** proxy/CDN sovrascrive, altrimenti un client può falsificarlo.
- **CSRF**: Better Auth confronta l'header `Origin` delle richieste che modificano lo stato con `BETTER_AUTH_URL` e `TRUSTED_ORIGINS`. I cookie sono `HttpOnly`, `SameSite=Lax` e `Secure` in HTTPS.
- **Header di sicurezza** in `next.config.ts`: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Secret**: uno per progetto e per ambiente. Ruotarlo invalida tutte le sessioni.

## 12. Troubleshooting

| Sintomo | Causa e soluzione |
|---|---|
| Google: `Error 400: redirect_uri_mismatch` | L'URI `{BETTER_AUTH_URL}/api/auth/callback/google` non è registrato sul client OAuth, oppure differisce per schema, host (`www`), porta o slash finale. Controlla anche che `BETTER_AUTH_URL` corrisponda all'URL reale. |
| Google: "Accesso bloccato / app non verificata" o solo alcuni utenti entrano | Consent screen ancora in *Testing*: pubblicalo *In produzione* (§5). |
| Registrazione con un'email già usata (es. con Google): si arriva a "Verifica la tua email" e non c'è nessun link di verifica | Comportamento voluto (anti user enumeration): Better Auth risponde come a una registrazione nuova e non crea l'account. Al titolare arriva l'email "Hai già un account" (`onExistingUserSignUp` in `server.ts`), con i link al login e a "imposta password". Vedi README, "Come funziona la verifica email". |
| Login risponde 403 `EMAIL_NOT_VERIFIED` | Comportamento voluto: un nuovo link parte automaticamente. In dev cercalo in `.dev-mailbox.jsonl`; in prod controlla i log `[auth] invio email … fallito` e lo stato del dominio sul provider email. |
| 403 `INVALID_ORIGIN` / "Invalid origin" dietro proxy o su un dominio alternativo | L'`Origin` del browser non è `BETTER_AUTH_URL`. Aggiungi l'origine a `TRUSTED_ORIGINS` (es. `https://www.dominio.it`, URL di preview). Dietro un reverse proxy verifica che `BETTER_AUTH_URL` sia l'URL pubblico HTTPS, non quello interno. |
| 403 "Invalid callbackURL" | Un `callbackURL` / `redirectTo` punta a un'origine non fidata. Usa path relativi (`continueUrl()`). |
| OAuth → `/auth/error?error=account_not_linked` | Esiste un utente con la stessa email non verificata (§11): l'utente deve verificare l'email, poi riprovare. |
| OAuth → `state_mismatch` / `state_not_found` | Cookie di stato perso: login iniziato su un host e concluso su un altro (`localhost` vs `127.0.0.1`, `www` vs apex) oppure scaduto. |
| OIDC → `email_not_found` | Il provider non restituisce `email`: aggiungi lo scope o il claim lato IdP. |
| 429 in sviluppo | `AUTH_RATE_LIMIT=on`. I contatori sono nella tabella `rateLimit`: svuotala o attendi la finestra. |
| Le email non arrivano in produzione | `EMAIL_PROVIDER` non impostato (in prod non c'è default), API key senza permesso di invio, `EMAIL_FROM` su un dominio non verificato, oppure email finite in spam per DNS (SPF/DKIM/DMARC) incompleti. |
| Il proxy reindirizza al login anche da loggato | Il cookie ha un nome diverso (es. `cookiePrefix` personalizzato): passa le stesse opzioni a `getSessionCookie(request, { cookiePrefix })`. |
| `npx auth generate` fallisce con `ERR_REQUIRE_ESM` | Node < 20.19: aggiorna Node o confronta lo schema a mano. |

## 13. Opzionale: backend esterno (JWT + JWKS)

Serve **solo** se un backend separato (NestJS o altro) deve fidarsi della sessione dell'app Next, come il BFF di reservation-app. Non fa parte del core e non è attivo nella demo.

Il plugin `jwt` di Better Auth firma un token con una chiave **asimmetrica** ed espone le chiavi pubbliche su un endpoint JWKS. Il backend verifica i token senza conoscere alcun secret.

**1. App Next: attiva il plugin** in `lib/auth/server.ts`, prima di `nextCookies()`:

```ts
import { genericOAuth, jwt } from "better-auth/plugins";

plugins: [
  jwt({
    jwks: { keyPairConfig: { alg: "ES256" } }, // default EdDSA; ES256 è supportato da più librerie
    jwt: {
      issuer: env.BETTER_AUTH_URL,
      audience: "https://api.tuodominio.it",
      expirationTime: "15m",
      definePayload: ({ user }) => ({ email: user.email, role: user.role }),
    },
  }),
  nextCookies(),
],
```

**2. Schema**: il plugin richiede la tabella `jwks` (le chiavi private sono cifrate con `BETTER_AUTH_SECRET`):

```prisma
model Jwks {
  id         String    @id
  publicKey  String
  privateKey String
  createdAt  DateTime
  expiresAt  DateTime?
  alg        String?
  crv        String?

  @@map("jwks")
}
```

**3. Chiamata al backend** dal server Next (route handler, server action o server component):

```ts
const { token } = await auth.api.getToken({ headers: await headers() });
await fetch("https://api.tuodominio.it/orders", { headers: { Authorization: `Bearer ${token}` } });
```

Endpoint esposti: `GET /api/auth/token` (token della sessione corrente) e `GET /api/auth/jwks` (chiavi pubbliche; il path si cambia con `jwks.jwksPath`).

**4. Backend: verifica** (con [`jose`](https://github.com/panva/jose), funziona in NestJS come in qualsiasi runtime Node):

```ts
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("https://tuodominio.it/api/auth/jwks"));

export async function verify(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: "https://tuodominio.it",
    audience: "https://api.tuodominio.it",
  });
  return payload; // sub = user.id, email, role
}
```

Il ruolo nel token è una fotografia valida per `expirationTime`: una revoca ha effetto alla scadenza del token. Tieni la scadenza breve, o fai interrogare il DB al backend per le operazioni critiche.

## 14. Opzionale: plugin admin di Better Auth

Il template gestisce i ruoli con un campo `role` e una server action. Better Auth offre anche il plugin `admin` (`better-auth/plugins`), con ban, impersonificazione, gestione delle sessioni e permessi granulari. Non è attivo: se lo adotti, aggiunge i propri campi (`role`, `banned`, `banReason`, `banExpires`, `impersonatedBy`) e va riconciliato con `user.additionalFields.role` di questo template. Rigenera lo schema (§4) e rivedi `lib/auth/roles.ts`.

## 15. Note di migrazione da next-auth v4

Il template è pensato per **nuovi progetti**. order-app e reservation-app non vanno migrati con questo repository. Se in futuro servisse, ecco cosa toccare:

- **Password bcrypt**: Better Auth usa scrypt. Configura `emailAndPassword.password.verify` per accettare anche gli hash bcrypt esistenti (`$2a$`/`$2b$`) e `password.hash` per i nuovi, oppure ri-hasha al primo login riuscito.
- **Utenti**: copia `User` nelle tabelle di Better Auth (`id`, `name`, `email`, `emailVerified`, `role`). Per ogni utente con password crea una riga `Account` con `providerId = "credential"`, `accountId = user.id` e l'hash in `password`.
- **Google**: il `googleId` salvato sullo user diventa una riga `Account` con `providerId = "google"` e `accountId = googleId`.
- **Sessioni**: i JWT di next-auth non sono riconosciuti, quindi tutti gli utenti dovranno rifare il login. Annuncialo.
- **Google Cloud**: il redirect URI cambia da `/api/auth/callback/google` di next-auth allo stesso path di Better Auth. Verifica comunque che `BETTER_AUTH_URL` coincida con il vecchio `NEXTAUTH_URL`.
- **Codice**: `getServerSession` → helper di `lib/auth/helpers.ts`; `useSession` di next-auth → `useSession` di `lib/auth/client.ts`; `signIn("credentials")` → `authClient.signIn.email`.

## 16. White list di email (AUTH_ALLOWLIST)

Limita registrazione e login alle email (o ai domini) inseriti in `/admin/allowed-emails`. È **opt-in**: con `AUTH_ALLOWLIST` vuoto il template si comporta come senza white list.

**Attivazione**

1. Imposta `AUTH_ADMIN_EMAILS` con almeno un admin: è sempre ammesso, anche con la lista vuota.
2. Applica la migration `allowed_email` (`npx prisma migrate dev`).
3. Aggiungi in `/admin/allowed-emails` le email e i domini (`@azienda.it`) che devono entrare, **prima** di accendere il flag: chi esiste già e non è in lista verrà rifiutato al prossimo login.
4. Imposta `AUTH_ALLOWLIST=on` e riavvia.

**Dove viene applicata**

| Flusso | Controllo |
|---|---|
| Registrazione email | hook `before` su `/sign-up/email`: 403 `EMAIL_NOT_ALLOWED` |
| Google / OIDC (primo accesso, collegamento, re-login) | `user.validateUserInfo`: redirect a `/auth/error?error=email_not_allowed` |
| Login email di utente esistente, link di verifica, qualsiasi sessione | `databaseHooks.session.create.before`: 403 `EMAIL_NOT_ALLOWED` |

**Chi è sempre ammesso**: gli admin in `AUTH_ADMIN_EMAILS` e chiunque abbia ruolo ADMIN nel DB. Così un admin promosso non può essere escluso dalla propria lista.

**Rimozione di una voce**: le sessioni aperte degli utenti che perdono l'accesso vengono revocate subito. Un utente che resta ammesso da un'altra voce (es. la stessa email o il dominio) non viene toccato.

**Cosa non copre**

- Il reset password resta disponibile anche per email fuori lista: la risposta è identica a quella di un account esistente (anti user enumeration), ma l'utente non riuscirà ad accedere.
- Il messaggio di rifiuto **rivela** se un'email è in lista: è una scelta, perché il messaggio deve essere chiaro. Se serve l'opposto, sostituisci i messaggi in `lib/auth/texts.ts` con un testo generico e accetta che chi è escluso non capisca il motivo.
- Il controllo vive nel DB, quindi ogni login e registrazione fa una query su `allowed_email` (più una su `user` per gli utenti non ammessi). Le richieste già autenticate non ne fanno.

**Troubleshooting**

| Sintomo | Causa |
|---|---|
| Nessuno riesce a entrare dopo aver acceso il flag | Lista vuota e nessun admin in `AUTH_ADMIN_EMAILS`. Imposta l'admin, riavvia, aggiungi le voci. |
| Un utente verificato viene rifiutato | Non è in lista né ha ruolo ADMIN. Aggiungilo in `/admin/allowed-emails`. |
| Google rifiuta con `email_not_allowed` | Stessa causa, ma sull'account Google usato. |
| Dopo la rimozione l'utente è ancora dentro | Revoca su una sessione già scaduta o un'altra voce lo ammette ancora (controlla la lista). |

## 17. Rate limit: finestre e come cambiarle

Il rate limit protegge dai tentativi ripetuti (password indovinate, invio massivo di email). È **spento in sviluppo** (si accende con `AUTH_RATE_LIMIT=on`) e **sempre acceso in produzione**. I contatori stanno nella tabella `rateLimit` del database, quindi valgono anche con più istanze (serverless).

**Come conta:** per ogni coppia **IP + percorso** una finestra a scorrimento: alla prima richiesta parte la finestra, si contano le richieste, a finestra scaduta il contatore riparte. Superato il massimo risponde `429` con l'header `X-Retry-After` (secondi).

### Limiti attuali

Definiti in `lib/auth/server.ts` → `rateLimit`:

| Percorso | Finestra | Max richieste |
|---|---|---|
| `/sign-in/email` | 60 s | **5** |
| `/sign-up/email` | 60 s | **3** |
| `/request-password-reset` | 300 s | **3** |
| `/send-verification-email` | 300 s | **3** |
| tutto il resto di `/api/auth/*` | 60 s | **100** |

Better Auth applica in più delle regole di default, **più strette**, ai percorsi che non hanno una regola nostra: `/sign-in/*`, `/sign-up/*`, `/change-password` e `/change-email` → **3 richieste ogni 10 secondi**; `/request-password-reset` e `/send-verification-email` → 3 ogni 60 s. Le nostre `customRules` le **sostituiscono** per i quattro percorsi della tabella. Esempio: `/change-password` non ha una regola nostra, quindi vale quella di default (3 ogni 10 s).

La pagina Google/OIDC (`/sign-in/social`, `/callback/*`) rientra nelle regole di default sopra.

### Come cambiarli

Modifica `rateLimit.customRules` in `lib/auth/server.ts`:

```ts
rateLimit: {
  enabled: env.rateLimitEnabled,
  storage: "database",
  window: 60, // finestra generica, in secondi
  max: 100,   // massimo generico
  customRules: {
    "/sign-in/email": { window: 60, max: 5 },        // più severo: { window: 300, max: 5 }
    "/change-password": { window: 60, max: 5 },      // aggiungi una regola per un altro percorso
    "/get-session": false,                           // false = nessun limite per quel percorso
  },
},
```

- Le chiavi sono i percorsi **senza** `/api/auth`. Supportano il carattere jolly `*` (es. `"/sign-in/*"`).
- Una regola può anche essere una funzione `async (request) => ({ window, max })`, per esempio per essere più larghi con certi IP.
- **Sviluppo:** per provare i limiti metti `AUTH_RATE_LIMIT="on"` nel `.env` (o `$env:AUTH_RATE_LIMIT = "on"` in PowerShell) e riavvia.
- **Se vedi 429 inattesi** in sviluppo: svuota i contatori con `TRUNCATE "rateLimit";` (vedi README, "Ripulire il database") o aspetta la fine della finestra.
- **Dietro un proxy o una CDN**: il limite è per IP, quindi l'IP va letto dall'header giusto (`AUTH_IP_HEADERS`, es. `x-real-ip` su Vercel). Se non si riesce a determinare l'IP, tutti gli utenti condividono **un unico contatore** per percorso e si bloccano a vicenda: nei log compare l'avviso *"Rate limiting could not determine a client IP"*.

## 18. `BETTER_AUTH_URL` e `TRUSTED_ORIGINS`: a cosa servono e come impostarle

**`BETTER_AUTH_URL`** è l'indirizzo pubblico **canonico** dell'app (schema + host + porta, senza slash finale). Better Auth lo usa per:

- costruire i link nelle email (verifica, reset, "Hai già un account");
- costruire il redirect URI di Google/OIDC (`{BETTER_AUTH_URL}/api/auth/callback/…`);
- decidere quale `Origin` è fidata nelle richieste che modificano lo stato (CSRF) e se un `callbackURL` è interno;
- il prefisso del cookie: con `https://` il cookie si chiama `__Secure-better-auth.session_token` ed è `Secure`.

**`TRUSTED_ORIGINS`** è un elenco di origini **aggiuntive** da cui il browser può chiamare l'API (controllo CSRF). Non cambia i link nelle email e non cambia il cookie.

### Regola: un solo host

Il cookie di sessione è legato all'host. `localhost` e `127.0.0.1` per il browser sono siti diversi, quindi una sessione creata su uno non esiste sull'altro. Per questo:

1. `BETTER_AUTH_URL` deve essere **identico a quello che scrivi nella barra del browser**.
2. Apri l'app **solo** da quell'indirizzo, in tutte le schede.
3. Lascia `TRUSTED_ORIGINS` vuoto, a meno che l'app sia davvero raggiunta da un secondo indirizzo.

Sintomi tipici di un host sbagliato:

| Sintomo | Causa |
|---|---|
| Il link nella mail apre `localhost` ma stai lavorando su `127.0.0.1` (o viceversa): rimbalzi al login senza verifica | La mail usa `BETTER_AUTH_URL`; il cookie creato dalla verifica vale per l'altro host |
| Il login si interrompe, alcune pagine puntano a un host diverso | Schede aperte su host diversi, oppure `BETTER_AUTH_URL` diverso dall'indirizzo usato |
| 403 `INVALID_ORIGIN` | L'`Origin` del browser non è né `BETTER_AUTH_URL` né in `TRUSTED_ORIGINS` |
| Google: `redirect_uri_mismatch` | `BETTER_AUTH_URL` diverso dall'URI registrato su Google Cloud |

### Quando serve `TRUSTED_ORIGINS`

Solo se lo **stesso** deploy risponde a più indirizzi che gli utenti usano davvero, per esempio `https://www.dominio.it` accanto a `https://dominio.it`, o l'URL di preview di un branch. In quel caso `BETTER_AUTH_URL` resta quello canonico e gli altri vanno in `TRUSTED_ORIGINS`, separati da virgola. Meglio ancora: reindirizza l'host secondario a quello canonico a livello di hosting.

### Provare in locale

Con `npm run dev`, aprire l'app da un host diverso da `localhost` fa bloccare a Next gli asset del dev server (errori WebSocket/HMR): è un limite del dev server, non del login. Il controllo dell'origine si prova meglio sull'API:

```bash
# Origine non fidata → 403 INVALID_ORIGIN
curl -si -X POST http://localhost:3000/api/auth/sign-in/email -H "Origin: http://127.0.0.1:3000" -H "Content-Type: application/json" -d '{"email":"a@b.it","password":"x"}'
```

Metti `TRUSTED_ORIGINS="http://127.0.0.1:3000"`, riavvia e ripeti: la richiesta non deve più essere rifiutata per l'origine (con credenziali sbagliate l'errore diventa quello delle credenziali).
