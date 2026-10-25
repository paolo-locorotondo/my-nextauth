# Piano di test manuale: my-nextauth

Elenco dei test da eseguire per dichiarare il template funzionante. Spunta ogni caso e annota l'esito nella tabella in fondo.

I test automatici (§0) coprono già gran parte dei flussi via HTTP. Questo piano verifica quello che serve un browser per vedere (UI, redirect reali, provider esterni, email vere) più i casi limite.

## Prerequisiti

- `.env` da `.env.example`, con `BETTER_AUTH_SECRET` generato.
- `npm run db:up`, `npx prisma migrate dev`, `npm run db:seed` (ADMIN: `admin@example.com` / `Admin123!`).
- `npm run dev` → http://localhost:3000. Adminer su http://localhost:8080 per controllare il DB.
- Email in dev: console del server e `.dev-mailbox.jsonl`.
- Usa una **finestra anonima** per ogni nuovo utente, così le sessioni non si mescolano.
- Indirizzi di test: `G` = il tuo account Google; `X`, `Y` = email inventate (es. `x@example.com`).

Pulizia tra un giro e l'altro: cancella gli utenti di test da Adminer (tabella `user`; account e sessioni si cancellano a cascata).

---

## 0. Test automatici

- [X] **0.1** `npm run typecheck`: nessun errore.
NOTE: output ottenuto:
```powershell
✓ Types generated successfully
npm notice 
npm notice New major version of npm available! 10.5.2 -> 12.2.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.2.0
npm notice Run npm install -g npm@12.2.0 to update!
npm notice
```
- [X] **0.2** `npm run lint`: nessun errore.
- [X] **0.3** `npm test`: tutti i test passano.
- [X] **0.4** `npm run build`: build completata.
- [X] **0.5** Con il rate limit acceso ed il db attivo e popolato con i dati di seed, lo smoke richiede 17 step ✓.

Avvia il db `docker compose up -d` e popolalo con i dati di seed `npm run db:seed`

In PowerShell, in un terminale con il dev server avviato così:

```powershell
$env:AUTH_RATE_LIMIT = "on"; npm run dev
```

poi, in un secondo terminale, lancia lo smoke così:

```powershell
npm run smoke
```

Chiudi il dev server e riavvialo senza quelle variabili per il resto del piano.

```powershell
$env:AUTH_RATE_LIMIT = ""; npm run dev
```

**NB**: `VAR=valore comando` non funziona in PowerShell: usa `$env:VAR = "valore"`.

- [X] **0.6** Con la white list accesa ed il db attivo e popolato con i dati di seed, lo smoke richiede 21 step ✓.

Avvia il db `docker compose up -d` e popolalo con i dati di seed `npm run db:seed`

In PowerShell, in un terminale con il dev server avviato così:

```powershell
$env:AUTH_ALLOWLIST = "on"; $env:AUTH_RATE_LIMIT = "on"; npm run dev
```

poi, in un secondo terminale, lancia lo smoke così:

```powershell
$env:SMOKE_ALLOWLIST = "on"; npm run smoke; Remove-Item Env:SMOKE_ALLOWLIST
```

Chiudi il dev server e riavvialo senza quelle variabili per il resto del piano.

```powershell
$env:AUTH_ALLOWLIST = ""; $env:AUTH_RATE_LIMIT = ""; npm run dev
```

**NB**: `VAR=valore comando` non funziona in PowerShell: usa `$env:VAR = "valore"`.

## A. Pagine pubbliche e redirect

- [X] **A.1** Da anonimo apri `/`: home con "Accedi" e "Registrati", nessun redirect.
- [X] **A.2** Da anonimo apri `/dashboard?tab=1`: redirect a `/auth/login?callbackUrl=%2Fdashboard%3Ftab%3D1`.
- [X] **A.3** Da anonimo apri `/admin` e `/user/change-password`: redirect al login con il rispettivo `callbackUrl`.
- [X] **A.4** Da anonimo apri `/api/demo/me`: JSON `{"error":"Unauthorized"}`, status 401 (DevTools → Network).
- [X] **A.5** Da anonimo apri `/auth/error?error=state_mismatch`: messaggio in italiano, pulsante "Riprova" verso il login.
- [X] **A.6** Da loggato apri `/auth/login` e `/auth/register`: redirect alla tua pagina di atterraggio, senza vedere il form.

## B. Registrazione e verifica email

- [X] **B.1** Su `/auth/register` lascia il nome vuoto, poi un'email non valida, poi una password debole (es. `password`): ogni volta un messaggio specifico, nessuna richiesta inviata.
- [X] **B.2** Password e conferma diverse: "Le password non coincidono".
- [X] **B.3** Prova una password per ogni regola mancante (senza maiuscola, senza minuscola, senza numero, senza carattere speciale, meno di 8 caratteri): il messaggio cita la regola giusta.
- [X] **B.4** Registrati con `X` e una password valida: pagina "Verifica la tua email" con l'indirizzo. In console e in `.dev-mailbox.jsonl` compare "Conferma il tuo indirizzo email".
- [X] **B.5** Con `EMAIL_PROVIDER="console"` e **prima** di cliccare il link, fai login con `X` e la password **corretta**: errore "Devi verificare la tua email…" con link "Invia di nuovo", e in `.dev-mailbox.jsonl` compare un **nuovo** "Conferma il tuo indirizzo email" (con una password sbagliata non parte nessuna mail: è voluto).
NOTE: è comparsa la pagina "Devi verificare la tua email…" con link "Invia di nuovo", ma non è partita nessun'altra mail con nuovo link di verifica.
RISPOSTA: il codice è corretto, l'ho riprodotto: con password **giusta** e account non verificato il login risponde 403 e **parte una nuova mail** (anche senza callbackURL). Se non l'hai vista, le cause probabili sono due: (1) la password era sbagliata: in quel caso il messaggio è "Email o password non corretti" e **non** parte nessuna mail, di proposito; (2) con `EMAIL_PROVIDER=resend` nel `.env` la mail non finisce in `.dev-mailbox.jsonl` ma va a Resend, e fallisce per i motivi di L.1. Ho precisato queste due condizioni nel test. **Rifai B.5** con `EMAIL_PROVIDER="console"`.
- [X] **B.6** Clicca il link di verifica: login automatico e atterraggio su `/dashboard`, che mostra "Account in attesa di approvazione" (ruolo NUOVO). Il menu mostra il nome e il badge `NUOVO`.
- [X] **B.7** Apri il link di verifica **dopo averlo manomesso**: cambia a mano qualche carattere del `token=` nell'URL. Atterri su "Verifica la tua email" con "link non valido o scaduto" e il pulsante "Invia di nuovo" funziona. (Riaprire un link **già usato** invece NON è un errore, vedi la risposta sotto. Per provare un link **scaduto**: dura 1 ora; in alternativa cambia `BETTER_AUTH_SECRET` e riavvia, e tutti i link in circolazione smettono di valere.)
NOTE: ho ricliccato il primo link generato e funziona, come tutti gli altri generati, mi aspettavo "Link non valido o scaduto".
RISPOSTA: **non è un difetto del codice: il test era sbagliato.** Il link di verifica è un token firmato (JWT) che **non viene salvato nel database**, quindi non esiste uno stato "già usato": cliccarlo più volte non dà errore, e dopo la prima volta l'utente è già verificato. Verificato: 1° click → sessione creata; 2° click senza sessione → nessuna sessione, atterri sul login; 2° click con sessione → `/dashboard`. Tutti i link emessi restano validi per 1 ora (anche quelli reinviati). Gli unici "non validi" sono quelli **manomessi** o **scaduti**; il test ora verifica quello. Dettagli nel README, "Come funziona la verifica email".

- [X] **B.8** Registrati con una `callbackUrl`: apri da anonimo `/admin` → login → "Registrati" (il link conserva `callbackUrl`) → registrati con `Y` → clicca il link di verifica: dopo la verifica arrivi su `/admin`, dove `Y` (NUOVO) vede "in attesa di approvazione".
- [X] **B.9** Registrati di nuovo con `X` (già esistente): stessa pagina "Verifica la tua email" di B.4, **nessun** errore visibile. In mailbox arriva "Hai già un account" con i link al login e a "Imposta o reimposta la password". In Adminer c'è ancora un solo utente `X`.
- [X] **B.10** Dopo aver creato `G` con Google (D.1), fai **logout** (devi essere anonimo, altrimenti `/auth/register` ti rimanda alla dashboard) e registrati con la stessa email `G` e una password: come B.9, pagina "Verifica la tua email", arriva "Hai già un account", nessun nuovo utente e nessuna sessione.
NOTE: non sono finito nella pagina come B.9, ma sono entrato nella dashboard con "Account in attesa di approvazione".
RISPOSTA: il test descriveva un caso diverso da quello che hai fatto. Se eri **già loggato con Google**, `/auth/register` ti manda subito alla tua pagina (è A.5: "da loggato non vedi il form"), quindi non arrivi mai a "Verifica la tua email": è il comportamento voluto. Il caso del feedback (registrarsi con l'email di un utente Google) va provato **da anonimo**. L'ho riprodotto così: `sign-up` su un'email con account Google, da anonimo → 200, nessuna sessione, nessun nuovo utente, una mail "Hai già un account". Il test ora dice di fare prima il logout.

## C. Login email e password

- [X] **C.1** Login con l'ADMIN di seed: atterraggio su `/admin`.
- [X] **C.2** Logout, poi login ADMIN partendo da `/dashboard` (redirect al login con callbackUrl): dopo il login sei su `/dashboard`, non su `/admin`.
- [X] **C.3** Password errata: "Email o password non corretti." Email inesistente: **stesso** messaggio.
- [X] **C.4** Il pulsante occhio nel campo password mostra e nasconde la password quando lo clicchi. Poi con la tastiera: scrivi nel campo password e premi **Tab**: il focus passa al link/pulsante successivo senza fermarsi sull'occhio (l'occhio si usa solo con il mouse).
NOTE: cosa intendi con "non ruba il focus con Tab"?
RISPOSTA: la frase era poco chiara. Intendevo: premendo **Tab** dal campo password, il focus deve passare al pulsante successivo e non fermarsi sull'icona dell'occhio (nel codice l'occhio ha `tabIndex={-1}`, quindi con la tastiera ci si salta). L'occhio resta cliccabile con il mouse. Ho riscritto il test.
- [X] **C.5** Su `/auth/login?callbackUrl=https://evil.com` fai login: atterri sulla tua pagina di ruolo, mai su evil.com. Ripeti con `callbackUrl=//evil.com` e `callbackUrl=/%2F%2Fevil.com`.

## D. Google

Richiede `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, con i redirect URI registrati (INTEGRATION §5).

- [X] **D.1** Nuovo utente: "Accedi con Google" → scelta dell'account (`select_account`) → atterraggio su `/dashboard` con ruolo NUOVO. In Adminer: `emailVerified = true`, un `account` con `providerId = google`.
- [X] **D.2** Login Google partendo da `/admin?x=1` da anonimo: dopo Google torni su `/admin?x=1`.
- [X] **D.3** Annulla sulla schermata di Google: torni a `/auth/error` con un messaggio comprensibile (es. "Accesso annullato…").
NOTE: atterro sulla pagina `/auth/error?error=state_mismatch` e vedo questo in console:
```powershell
 POST /api/auth/sign-in/social 200 in 43ms (next.js: 13ms, application-code: 30ms)
2026-10-21T15:23:45.826Z ERROR [Better Auth]: Failed to parse state [Error [BetterAuthError]: State mismatch: State not persisted correctly] {
  code: 'state_security_mismatch',
  details: { state: 'U-WAnSOKSCLyf83YIgat8_cNDJfXesGT' },
  errorURL: '/auth/error'
}
 GET /api/auth/callback/google?error=access_denied&state=U-WAnSOKSCLyf83YIgat8_cNDJfXesGT 302 in 103ms (next.js: 12ms, application-code: 92ms)
 ```
- [X] **D.4** Senza le env Google (svuotale e riavvia): il pulsante Google sparisce da login e registrazione, così come il separatore "oppure" se non ci sono altri provider.
NOTE: come previsto non vedo il separatore "oppure", ma vedo un riquadro:
```html
<div role="alert" class="rounded-lg border px-3 py-2 text-sm border-red-200 bg-red-50 text-red-700"></div>
```
è corretto?
RISPOSTA: **era un bug mio, ora corretto.** Il componente che mostra gli errori controllava `!children`, ma nel login i figli sono due espressioni (`{error}` e `{unverified && …}`): React riceve un array con due elementi vuoti, che è "truthy", quindi il riquadro rosso compariva anche senza errori. Non c'entrava Google: succedeva sempre, solo che con il pulsante Google non si notava. L'ho visto sull'HTML reale prima della correzione (un `<div role="alert">` vuoto). Ora il riquadro compare solo se c'è un messaggio. **Riprova D.4**: nessun riquadro rosso vuoto.

- [X] **D.5** Il consent screen mostra il nome dell'app corretto (non quello di un altro progetto).

## E. Collegamento account (stessa email)

- [X] **E.1** Email verificata e poi Google: registra e verifica `G` con email+password, poi fai logout e "Accedi con Google" con `G`. Risultato: un solo utente, con 2 righe `account` (`credential` e `google`). Funzionano entrambi i login.
- [X] **E.2** Prima Google, poi password: dopo D.1 usa "Password dimenticata" con `G` e imposta una password. Poi fai login con email e password. Risultato: un solo utente, con un `account` `credential` in più.
- [X] **E.3** Protezione da takeover: registra `G` con email+password ma **non** verificarla, poi prova "Accedi con Google" con `G`. Il collegamento viene rifiutato: finisci su `/auth/error` con "Esiste già un account con questa email non ancora verificato…" (codice `account_not_linked`). Nessun `account` google creato.

## F. OIDC generico (es. IBM w3id preprod)

Richiede `OIDC_*` configurate e il redirect URI `{BETTER_AUTH_URL}/api/auth/callback/{OIDC_PROVIDER_ID}` registrato presso l'IdP.

- [X] **F.1** Compare il pulsante "Accedi con {OIDC_LABEL}".
- [X] **F.2** Login completo: atterraggio per ruolo; utente con `emailVerified = true` e `account.providerId = {OIDC_PROVIDER_ID}`.
- [X] **F.3** Stessa email di un utente esistente verificato: collegamento automatico, come in E.1.
- [X] **F.4** Senza le env OIDC il pulsante non compare.

## G. Password dimenticata e reset

- [X] **G.1** Con un'email registrata: messaggio "Se l'indirizzo è registrato…" e arriva l'email "Reimposta la tua password".
- [X] **G.2** Con un'email **non** registrata: **stesso** messaggio, nessuna email, tempo di risposta simile.
- [X] **G.3** Il link apre `/auth/reset-password?token=…`. Una password debole viene rifiutata; una valida porta al login con "Password aggiornata".
- [X] **G.4** La vecchia password non funziona più, la nuova sì.
- [X] **G.5** Revoca delle sessioni: sii loggato con lo stesso utente in un altro browser, esegui il reset e ricarica l'altro browser. Quella sessione è scaduta (redirect al login).
- [X] **G.6** Riusa lo stesso link di reset: "Il link non è valido o è scaduto" con "Richiedi un nuovo link".
- [X] **G.7** Apri `/auth/reset-password` senza token: messaggio di link non valido.

## H. Cambio password

- [X] **H.1** Utente con password: password attuale errata → errore; nuova uguale all'attuale → errore; nuova debole → errore; caso valido → "Password aggiornata".
NOTE: l'api /api/auth/change-password torna 400 se la password attuale non è corretta, ma quest'api la posso usare solo se loggato? spero di si, altrimenti sarebbe un api utilizzabile da chiunque per scoprire le password.
RISPOSTA: sì, **solo da loggato**. Verificato: `POST /api/auth/change-password` **senza sessione** risponde `401 {"code":"UNAUTHORIZED"}` e non controlla alcuna password. Nel codice di Better Auth l'endpoint ha il middleware `sensitiveSessionMiddleware`. Con la sessione di un utente puoi provare solo la password **di quell'utente**, che già la conosce. In più `/change-password` ha un rate limit (default 3 richieste ogni 10 secondi per IP, vedi K.1).
- [X] **H.2** Dopo il cambio la sessione corrente resta attiva, mentre quella in un altro browser viene disconnessa.
- [X] **H.3** Utente solo Google: la pagina mostra il messaggio "usa un provider esterno" e il link "Imposta una password" verso "Password dimenticata".
- [X] **H.4** Un utente NUOVO (verificata mail) può aprire `/user/change-password` (non vede "in attesa di approvazione"), mentre utente appena registrato con mail non verificata vede `auth/login?callbackUrl=%2Fuser%2Fchange-password`.

## I. Ruoli e autorizzazione

- [X] **I.1** NUOVO: `/dashboard` e `/admin` mostrano "in attesa di approvazione". `/api/demo/me` → 200; `/api/demo/admin` → 403 con `"error":"Pending approval"}`.
- [X] **I.2** Da ADMIN, in `/admin`, porta un utente a `USER`. Senza che l'utente rifaccia il login, al reload `/dashboard` mostra la dashboard, `/admin` mostra "Accesso negato" e `/api/demo/admin` risponde 403 con `{"error":"Forbidden"}`.
- [X] **I.3** Porta l'utente ad `ADMIN`: al reload vede `/admin` e il link "Admin" nell'header. Riportalo a USER: perde l'accesso subito.
NOTE: dopo averlo riportato da ADMIN a USER, col reload ho perso l'accesso come dici nel test, ma se prima di fare reload ero nella pagina /admin e provo ad aggiornare il ruolo di un utente, vado in 500:
Vedo questo nella pagina web:
```
## Error Type
Runtime Error

## Error Message
Auth: forbidden


    at requireRole (lib\auth\helpers.ts:84:20)
    at setUserRole (app\admin\actions.ts:15:24)
    at role (app\admin\page.tsx:40:7)
    at <anonymous> (app\admin\page.tsx:72:44)
    at Array.map (<anonymous>:1:18)
    at UsersTable (app\admin\page.tsx:66:20)
    at children (app\admin\page.tsx:16:20)
    at AuthGate (components\auth\AuthGate.tsx:25:23)
    at AdminPage (app\admin\page.tsx:15:9)

## Code Frame
  82 | export async function requireRole(roles?: RoleInput, opts?: GuardOptions): Promise<AuthOk> {
  83 |   const r = await validateAuthFromServerSession(roles, opts);
> 84 |   if (!r.ok) throw new AuthError(r.reason);
     |                    ^
  85 |   return r;
  86 | }
  87 |

Next.js version: 16.4.0 (Turbopack)
```
Questo su console:
```
POST /admin 200 in 124ms (next.js: 11ms, proxy.ts: 6ms, application-code: 107ms)
  └─ ƒ setUserRole("163h7QHvBTBrnE7VAUVIilaMqFyKQfEO", "USER") in 16ms app/admin/actions.ts
⨯ Error: Auth: forbidden
    at requireRole (lib\auth\helpers.ts:84:20)
    at async setUserRole (app\admin\actions.ts:15:24)
  82 | export async function requireRole(roles?: RoleInput, opts?: GuardOptions): Promise<AuthOk> {
  83 |   const r = await validateAuthFromServerSession(roles, opts);
> 84 |   if (!r.ok) throw new AuthError(r.reason);
     |                    ^
  85 |   return r;
  86 | }
  87 | {
  reason: 'forbidden',
  digest: '3285714662'
}
 POST /admin 500 in 984ms (next.js: 19ms, proxy.ts: 12ms, application-code: 952ms)
  └─ ƒ setUserRole("ZDEmaAkZjwDwyLGUPaMslZfJGEkcJtQy", "USER") in 29ms app/admin/actions.ts
[browser] Uncaught Error: Auth: forbidden
    at requireRole (lib\auth\helpers.ts:84:20)
    at setUserRole (app\admin\actions.ts:15:24)
    at role (app\admin\page.tsx:40:7)
    at <anonymous> (app\admin\page.tsx:72:44)
    at Array.map (<anonymous>:1:18)
    at UsersTable (app\admin\page.tsx:66:20)
    at children (app\admin\page.tsx:16:20)
    at AuthGate (components\auth\AuthGate.tsx:25:23)
    at AdminPage (app\admin\page.tsx:15:9)
  82 | export async function requireRole(roles?: RoleInput, opts?: GuardOptions): Promise<AuthOk> {
  83 |   const r = await validateAuthFromServerSession(roles, opts);
> 84 |   if (!r.ok) throw new AuthError(r.reason);
     |                    ^
  85 |   return r;
  86 | }
```

- [X] **I.4** Nella riga del proprio utente, l'ADMIN non ha il selettore del ruolo.
- [X] **I.5** Bootstrap admin: aggiungi un'email nuova a `AUTH_ADMIN_EMAILS`, riavvia e registrala. Dopo la verifica il ruolo è ADMIN. Un utente **già esistente** aggiunto alla lista non viene promosso (comportamento atteso).
- [X] **I.6** Il ruolo non si può forzare in registrazione: invia `POST /api/auth/sign-up/email` con `"role":"ADMIN"` nel body (RestClient `test\test_rest_client.http` o curl). L'utente creato ha comunque il ruolo NUOVO, oppure la richiesta viene rifiutata.
- [X] **I.7** Eliminazione utente da `/admin`: crea un utente di prova (registrato con email o Google), poi su `/admin` premi **Elimina** sulla sua riga. Compare una conferma che elenca cosa viene cancellato. Annulla: non cambia nulla. Conferma: la riga sparisce senza ricaricare e in Adminer non resta nulla in `user`, `account`, `session` e nessun `verification` con `value` = id dell'utente. Se l'utente era loggato altrove, al reload di quel browser è anonimo.
- [X] **I.8** Protezioni dell'eliminazione: sulla riga dell'ADMIN che sta operando non c'è il pulsante (compare "(tu)"). Un utente in `AUTH_ADMIN_EMAILS` non si può eliminare dalla UI (messaggio "protetto da AUTH_ADMIN_EMAILS").
- [X] **I.9** Layout su telefono (DevTools → modalità dispositivo, 320–375 px): su `/admin` gli utenti sono schede e non c'è scroll orizzontale; header, login, registrazione, white list e dashboard restano leggibili e senza scroll orizzontale.

## J. Logout e sessioni

- [X] **J.1** "Esci" dal menu: torni alla home come anonimo; `/dashboard` reindirizza di nuovo al login.
- [X] **J.2** Dopo il logout il tasto "indietro" del browser non mostra contenuti riservati utilizzabili: un reload reindirizza al login.
- [X] **J.3** Elimina un utente da Adminer mentre è loggato: al reload successivo risulta anonimo.

## K. Sicurezza

- [X] **K.1** Rate limit (con `AUTH_RATE_LIMIT=on`): 6 login errati di fila entro un minuto. Il sesto mostra "Troppi tentativi. Riprova tra qualche minuto."
NOTE: funziona come dici, ma servirebbe documentare da qualche parte le attuali finestre e come customizzarle
RISPOSTA: hai ragione, mancava. Ho aggiunto in INTEGRATION.md la sezione "Rate limit" con la tabella completa e come cambiarla. In sintesi: le regole stanno in `lib/auth/server.ts` → `rateLimit.customRules`. Quelle attuali: login 5/min, registrazione 3/min, reset password e reinvio verifica 3 ogni 5 minuti, tutto il resto 100/min. Il conteggio è **per IP e per percorso**, salvato nella tabella `rateLimit`. Better Auth ha anche regole di default più strette (3 richieste ogni 10 secondi su sign-in, sign-up e change-password) che valgono dove non ce n'è una nostra: ad esempio `/change-password`.
- [?] **K.2** Cookie (DevTools → Application → Cookies): `better-auth.session_token` ha `HttpOnly` e `SameSite=Lax`. In produzione HTTPS il nome ha il prefisso `__Secure-` ed è `Secure`. **In locale si verifica solo la prima parte**; il prefisso `__Secure-` e `Secure` si controllano al primo deploy HTTPS (senza dominio e hosting non è verificabile: lascia `[?]` con la nota "da fare al deploy").
NOTE: ok per dev, ma come verifico in produzione?
RISPOSTA: stessa procedura, ma sul sito pubblico in **HTTPS**: DevTools → Application → Cookies → il tuo dominio. Cerca `__Secure-better-auth.session_token` e controlla le colonne `HttpOnly`, `Secure` e `SameSite` = `Lax`. Il prefisso `__Secure-` compare perché `BETTER_AUTH_URL` inizia con `https://`: se lo vedi senza prefisso, l'URL è sbagliato o il sito gira in HTTP. Da terminale, senza browser, guarda gli header `Set-Cookie` della risposta di login: `curl -si -X POST https://TUO-DOMINIO/api/auth/sign-in/email -H "Origin: https://TUO-DOMINIO" -H "Content-Type: application/json" -d '{"email":"…","password":"…"}'`.
NOTE: ma io non ho un dominio e non ho messo su un hosting l'applicazione, quindi come verifico questo https?
- [X] **K.3** Header di risposta (DevTools → Network → clicca la pagina → Response Headers): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
NOTE: come valore di `Referrer-Policy` vedo `strict-origin-when-cross-origin` è corretto?
RISPOSTA: sì, è esattamente il valore impostato in `next.config.ts` ed è anche il default dei browser moderni. Significa: verso lo stesso sito invia l'URL completo, verso altri siti solo l'origine (il dominio) e niente se si passa da HTTPS a HTTP. Non fa trapelare percorsi e parametri a siti esterni. Ho scritto il valore atteso nel test.
- [X] **K.4** CSRF: una `POST /api/auth/sign-in/email` con header `Origin: https://evil.com` viene rifiutata (403).
- [X] **K.5** Server action protetta (facoltativo, l'ho già verificato io: vedi la risposta). Con DevTools → Network aperto, da ADMIN cambia il ruolo di un utente in `/admin`. Clicca col destro la richiesta `admin` (POST) → *Copy as cURL (bash)*. Poi riesegui quel cURL sostituendo i cookie con quelli di un utente USER (o rimuovendoli): la risposta è un errore e il ruolo nel DB non cambia.
NOTE: non ho capito cosa devo fare.
RISPOSTA: scusa, il test era scritto in modo troppo tecnico. L'ho eseguito io e **passa**. Cosa verifica: una *server action* è un endpoint HTTP che chiunque può chiamare a mano, anche senza vedere il pulsante. Il test controlla che `setUserRole` (il cambio ruolo) rifiuti chi non è ADMIN. Esito (richiesta reale catturata dalla UI di un ADMIN e rigiocata): **senza cookie** → 307 al login e ruolo invariato; **utente USER** → 500 (`Auth: forbidden`; in produzione il messaggio viene nascosto) e ruolo invariato; **ADMIN** (controllo) → 200 e ruolo cambiato. Puoi non rifarlo a mano: la procedura è nel test, ma richiede DevTools.
NOTE: continuo a non riuscire a riprodurlo del tutto: sto usando l'estensione VSCode Rest Client e con i cookie di uno USER ottengo 500, mentre senza Cookie ottengo 200 e mi aspettavo 307
- [X] **K.6** Nessun segreto nel bundle client: dopo `npm run build`, cerca nei file di `.next/static` il **valore** dei segreti del tuo `.env` (non il nome della variabile, che compare nel codice delle librerie senza problemi). Nessuna occorrenza. Comando pronto con `node test/tools/check-secrets.mjs`, che non stampa mai i valori.
NOTE: ho trovato questa occorrenza: BETTER_AUTH_SECRET nel file ".next\static\chunks\2lilw3rex2o8u.js":
`,Object.freeze({get BETTER_AUTH_SECRET(){return s("BETTER_AUTH_SECRET")},get AUTH_SECRET(){return s("AUTH_SECRET")},`
RISPOSTA: **falso allarme: il test era formulato male.** Quello che hai trovato è solo il *nome* della variabile, dentro il codice di una libreria che la legge a runtime (`s("BETTER_AUTH_SECRET")` significa "leggi la variabile d'ambiente con questo nome"). Il *valore* del segreto non c'è. L'ho controllato con tre metodi indipendenti (Node, `grep -F`, .NET `IndexOf`): il valore di `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET` e `RESEND_API_KEY` **non compare** né nei 23 file di `.next/static` (quelli serviti al browser) né nei 455 di `.next/server`. Il test ora cerca il valore, non il nome. Se lo rifai in PowerShell: `Select-String -Quiet` in pipeline dà `True` anche per una stringa casuale, non usarlo per questo controllo.


## L. Email reali (produzione o staging)

- [SKIPEPD] **L.1** Resend: dominio *Verified*, `EMAIL_PROVIDER=resend`. Le email di verifica, reset e "hai già un account" arrivano in **inbox** (non in spam) su Gmail e Outlook. **Caso parziale senza dominio** (vedi la nota sotto L.1): esegui la forma ridotta e annota nel test quale parte hai verificato.
NOTE: fallisce l'invio con resend
```
[auth] invio email "verify" a x@example.com fallito: 
Error: Resend 422: {"message":"Invalid `to` field. Please use our testing email address instead of domains like `example.com`. See our documentation for more information.","name":"validation_error","statusCode":422}
    at Object.send (lib\auth\email\resend.ts:12:26)
    at async sendAuthEmail (lib\auth\email\index.ts:45:5)
    at async Object.sendVerificationEmail (lib\auth\server.ts:67:7)
  10 |         body: JSON.stringify({ from, to: [to], subject, html, text }),
  11 |       });
> 12 |       if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
     |                          ^
  13 |     },
  14 |   };
  15 | }
```
  Inoltre ho un dubbio su Resend: ma il dominio che creo deve corrsipondere a cosa? un dominio che devo avere/comprare? Al momento la verifica dominio è fallita su Resend e questo vedo:
  Domain not found: This domain wasn't found in any DNS servers yet. Propagation can take a few hours, but if the domain name is wrong, delete it and add the correct one.
  DNS check failed: All required records are missing. Fix records in your DNS provider. Once fixed, restart verification.
RISPOSTA — spiego i **due errori separati**:

**1) `422 Invalid `to` field… domains like example.com`**: non è un problema del dominio. Resend **rifiuta qualsiasi destinatario @example.com** (e @test.com), perché sono indirizzi che non esistono e farebbero rimbalzare le email. È lo stesso comportamento in prova e in produzione. Per testare usa **la tua casella reale** oppure gli indirizzi di test di Resend: `delivered@resend.dev` (consegnata), `bounced@resend.dev` (rimbalza), `complained@resend.dev` (segnalata come spam). Gli utenti di prova con `@example.com` vanno bene solo con `EMAIL_PROVIDER="console"`.

**2) La verifica del dominio fallita**: la risposta alla tua domanda è **sì, il dominio deve essere tuo, e va acquistato**. Resend invia da un dominio che possiedi: serve poter aggiungere record al suo DNS. Dal tuo `.env` risulta `EMAIL_FROM="My NextAuth <noreply@mail.my-nextauth.it>"`, cioè il sottodominio `mail.my-nextauth.it` di `my-nextauth.it`. Ho controllato: **`my-nextauth.it` non esiste nel DNS pubblico** (nessun record NS/SOA/A, neppure per `mail.my-nextauth.it`). Questo spiega esattamente i tuoi due messaggi: "Domain not found in any DNS servers" (il dominio non è registrato) e "All required records are missing" (non hai dove metterli). Il dominio che hai inserito su Resend non è il tuo.

**Cosa fare, in ordine**
1. **Procurati un dominio che possiedi.** Se non ne hai uno, compralo da un registrar (Cloudflare, Namecheap, Aruba, Register.it…): un `.it` costa pochi euro l'anno. Senza un dominio tuo **non puoi** inviare a destinatari diversi dal tuo indirizzo.
2. In Resend → *Domains → Add Domain* inserisci un **sottodominio** del tuo dominio (consigliato da Resend per tenere separata la reputazione delle email transazionali), ad esempio `mail.TUODOMINIO.it`. Non il dominio di un altro e non un nome inventato.
3. Resend mostra una tabella *Records* (DKIM, SPF e un MX/TXT per il Return-Path). Vanno aggiunti **identici**, copiando e incollando, nel pannello DNS **di chi gestisce davvero i nameserver del tuo dominio** (di solito il registrar, o Cloudflare se l'hai spostato lì).
4. Se usi Cloudflare e vedi dei CNAME: la nuvola deve essere **grigia** ("DNS only"), non arancione, altrimenti la verifica non si completa.
5. Premi *Verify*. Spesso bastano ~15 minuti; la propagazione può richiedere fino a 72 ore. Se resta in errore, *Restart verification*. Puoi controllare dall'esterno con `nslookup -type=TXT resend._domainkey.mail.TUODOMINIO.it`.
6. Quando il dominio è *Verified*, imposta `EMAIL_FROM="My NextAuth <noreply@mail.TUODOMINIO.it>"` e invia a una tua casella reale.

NB: Limiti del piano gratuito (dalla pagina prezzi di Resend): 3.000 email al mese, 100 al giorno, 3 domini.

- [?] **Senza dominio, L.1 si esegue solo in forma ridotta** (procedura in INTEGRATION §7): impsota nel .env `EMAIL_PROVIDER=resend` e mittente `EMAIL_FROM="My NextAuth <onboarding@resend.dev>"`. Le email verranno mandate solo al destinatario con l'email dell'account Resend. Verifica: la chiave API funziona, la mail arriva in casella spam (gmail), il link funziona. 
Invii verso altri utenti, 
NOTE: l'invio verso l'utente con mail uguale alla mail dell'account Resend funziona per tutti questi mittenti:
`EMAIL_FROM="My NextAuth <delivered@resend.dev>"`
`EMAIL_FROM="My NextAuth <bounced@resend.dev>"`
`EMAIL_FROM="My NextAuth <complained@resend.dev>"`
`EMAIL_FROM="My NextAuth <onboarding@resend.dev>"`
Tuttavia le mail di verifica e hai già account finiscono in spam (gmail), mentre quella di reset password in inbox (gmail). Volevo capire se è corretto riceverle tutte in spam (gmail) e che differenza c'è tra questi mittenti.
RISPOSTA: è normale senza dominio. `resend.dev` è un dominio condiviso da tutti gli utenti di prova, senza una reputazione tua, e Gmail decide anche in base al contenuto: ogni mail è valutata a sé, per questo reset in inbox e le altre in spam. `delivered@`, `bounced@` e `complained@resend.dev` sono indirizzi di test di Resend da usare come **destinatari** (simulano consegna, rimbalzo e segnalazione spam): come mittenti non hanno senso. Senza dominio l'unico mittente utile è `onboarding@resend.dev`. Il risultato "in inbox" si può ottenere solo con un dominio tuo verificato (SPF/DKIM/DMARC allineati).
- [X] **L.2** Header della mail ricevuta ("Mostra originale" in Gmail): `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
- [?] **L.3** I link nelle email puntano a `BETTER_AUTH_URL` (dominio di produzione, non localhost). In locale basta vedere che l'host del link sia quello di `BETTER_AUTH_URL`; se lo cambi in `127.0.0.1`, devi aprire anche l'app da `127.0.0.1` (vedi INTEGRATION §18), altrimenti il link porta a un host senza sessione e rimbalza al login.
NOTE: vedo lochalhost perchè non riesco in locale a cambiare il valore di `BETTER_AUTH_URL`, altrimenti vengo bloccato per origin non valido.
- [SKIPPED] **L.4** SendGrid (se usato): stesse verifiche di L.1–L.3 con `EMAIL_PROVIDER=sendgrid`.
- [X] **L.5** API key errata: la registrazione risponde comunque OK all'utente e nei log compare `[auth] invio email … fallito`.

## M. Build di produzione

- [X] **M.1** `npm run build && npm start`: l'app funziona come in dev (ripeti A.1, C.1, B.4).
- [X] **M.2** Con `NODE_ENV=production` e `BETTER_AUTH_SECRET` vuoto o più corto di 32 caratteri l'app non parte, con un messaggio chiaro.

Avvia il server in producion mode dopo aver modificato nel .env BETTER_AUTH_SECRET con valore corto "ASD" o vuoto "":
```powershell
npm start;
```
**NB**: `npm start` avvia lo script `next start` che in automatico imposta `NODE_ENV=production`. Mentre `npm run dev` avvia lo script `next dev` che in automatico imposta `NODE_ENV=development`

- [X] **M.3** Senza `EMAIL_PROVIDER` in produzione l'invio fallisce con un log esplicito (in produzione non c'è il default `console`).
NOTE: si è fallito e vedo questo in console:
```
[auth] invio email "verify" a y@example.com fallito: Error: EMAIL_PROVIDER non configurato (console | resend | sendgrid)
```
Ma mi aspettavo un errore anche sulla pagina web, invece ho la classica schermata "Verifica la tua email"
RISPOSTA: è il comportamento voluto, e hai fatto bene a segnalarlo. L'invio parte **dopo** la risposta HTTP (in background) per due motivi: la risposta è identica che l'utente esista o no, e i tempi non rivelano nulla (altrimenti un attaccante potrebbe capire quali email sono registrate). Per lo stesso motivo non può mostrare un errore di invio. Conseguenza: **in produzione l'errore sta solo nei log del server**, quindi vanno monitorati (cerca `[auth] invio email … fallito`). Il test è passato: l'errore è esplicito e dice cosa manca. Ho scritto questa spiegazione in INTEGRATION.md.
- [?] **M.4** Origine non fidata, **solo sull'API** (il dev server di Next non regge un host diverso da `localhost`, vedi INTEGRATION §18). Con `BETTER_AUTH_URL="http://localhost:3000"` e `TRUSTED_ORIGINS=""` lancia il cURL di INTEGRATION §18: risposta 403 `INVALID_ORIGIN`. Poi metti `TRUSTED_ORIGINS="http://127.0.0.1:3000"`, riavvia e ripeti: non è più rifiutata per l'origine. Non provarlo dal browser su `127.0.0.1`: i cookie sono per host e la sessione non si crea. In produzione è il caso `www.dominio.it` vs `dominio.it`.
NOTE: non ho capito come devo testarlo.
RISPOSTA: nessun deploy, si prova in locale. Il caso: il sito è raggiunto da un indirizzo diverso da `BETTER_AUTH_URL` (tipicamente `www.dominio.it` invece di `dominio.it`), e il login viene rifiutato perché l'origine non è fidata. Riproduzione in 3 minuti: (1) lascia `BETTER_AUTH_URL="http://localhost:3000"` e `TRUSTED_ORIGINS=""`; (2) apri **http://127.0.0.1:3000/auth/login** invece di localhost (per il browser è un'origine diversa) e prova ad accedere: errore "Richiesta non valida (origine non consentita)"; (3) metti `TRUSTED_ORIGINS="http://127.0.0.1:3000"`, riavvia, riprova: funziona. L'ho verificato sull'API: `POST /sign-in/email` con `Origin: http://127.0.0.1:3000` → 403 `INVALID_ORIGIN`. Nota: in sviluppo Next può bloccare gli asset dell'altro hostname (`allowedDevOrigins`), quindi se la pagina non si carica del tutto è un limite del dev server, non del login: il test della sola API (cURL con l'header `Origin`) basta.
NOTE: non riesco a riprodurlo in locale: se imposto `TRUSTED_ORIGINS="http://127.0.0.1:3000"` e `BETTER_AUTH_URL="http://localhost:3000"`, ho degli errori websocket in console di chrome e non riesco a usare l'applicazione

## N. Adozione in un progetto nuovo

- [ ] **N.1** In un `create-next-app` pulito copia i file di [MANIFEST.md](../MANIFEST.md) e segui la checklist di [INTEGRATION.md §1](../INTEGRATION.md#1-checklist-di-adozione). Tempo impiegato e passaggi poco chiari vanno annotati come feedback sulla doc.
- [ ] **N.2** Cambia ruoli e `landingForRole` in `config.ts` (es. aggiungi `MANAGER`): typecheck ok, il nuovo ruolo compare in `/admin` e l'atterraggio rispetta la nuova regola.
- [ ] **N.3** Aggiungi un campo nel blocco `APP FIELDS` dello schema e lancia la migration: l'autenticazione continua a funzionare.

---

## O. White list di email (`AUTH_ALLOWLIST=on`)

Prerequisito: `AUTH_ADMIN_EMAILS` valorizzato, poi `AUTH_ALLOWLIST=on` e riavvio del dev server (comandi PowerShell in 0.6). Lo smoke con la white list accesa richiede `$env:SMOKE_ALLOWLIST = "on"` prima di `npm run smoke` (21 step); senza la variabile gira la suite base (17 step).

- [X] **O.1** Con la lista vuota, registrazione con un'email qualsiasi: messaggio "Questo indirizzo email non è autorizzato…" nel form, nessun utente creato in Adminer.
- [X] **O.2** Con la lista vuota, login dell'admin di bootstrap (`AUTH_ADMIN_EMAILS`): entra.
- [X] **O.3** Login dell'admin di seed (`admin@example.com`, ruolo ADMIN nel DB, non in `AUTH_ADMIN_EMAILS`): entra, perché gli admin del DB sono sempre ammessi.
- [X] **O.4** Da `/admin` apri "Email ammesse" e aggiungi `@tuodominio.it`: compare in tabella. Ripeti con una voce `mario@x.it` con nota.
- [X] **O.5** Voci malformate (`foo`, `@`, `a@b@c`, `@dominio`): errore nel form, nulla salvato. Un duplicato: "Questa voce è già in lista".
- [X] **O.6** Registrazione con un'email del dominio ammesso: va avanti come in B.4. Con un altro dominio: rifiutata come O.1.
- [X] **O.7** Google con un account fuori lista: arrivo su `/auth/error` con il messaggio italiano sulla white list.
- [X] **O.8** Un utente già registrato e verificato, poi rimosso dalla lista: il login email dà "non autorizzato". La sessione aperta in un altro browser viene revocata alla rimozione (reload → anonimo).
- [X] **O.9** Rimuovi una voce `@dominio` con un utente del dominio che ha un'altra voce singola: l'utente con la voce singola resta dentro, gli altri vengono revocati.
- [X] **O.10** Un utente ADMIN del dominio rimosso dalla lista: resta ammesso (il ruolo ADMIN protegge dalla revoca).
- [X] **O.11** Pagina "Email ammesse" con la funzione spenta: compare l'avviso "La white list non è attiva".
- [X] **O.12** Con la funzione spenta, registrazione e login da chiunque: comportamento identico a prima (`npm run smoke` senza `SMOKE_ALLOWLIST`, 17/17).

## Esiti

| Sezione | Data | Esito (OK / KO / n.a.) | Note |
|---|---|---|---|
| 0. Automatici | | | |
| A. Pubbliche e redirect | | | |
| B. Registrazione e verifica | | | |
| C. Login email | | | |
| D. Google | | | |
| E. Collegamento account | | | |
| F. OIDC | | | |
| G. Reset password | | | |
| H. Cambio password | | | |
| I. Ruoli | | | |
| J. Logout e sessioni | | | |
| K. Sicurezza | | | |
| L. Email reali | | | |
| M. Produzione | | | |
| N. Adozione | | | |
| O. White list | | | |

Il template è **funzionante** quando le sezioni 0 e A–K sono OK. La sezione O è richiesta se la white list viene usata (altrimenti n.a.). L, M ed N vanno completate prima del primo progetto in produzione.
