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

- [ ] **0.1** `npm run typecheck`: nessun errore.
- [ ] **0.2** `npm run lint`: nessun errore.
- [ ] **0.3** `npm test`: tutti i test passano.
- [ ] **0.4** Avvia `AUTH_RATE_LIMIT=on npm run dev` e lancia `npm run smoke`: tutti gli step ✓. Fermalo e riavvia `npm run dev` normale per il resto del piano.
- [ ] **0.5** `npm run build`: build completata.

## A. Pagine pubbliche e redirect

- [ ] **A.1** Da anonimo apri `/`: home con "Accedi" e "Registrati", nessun redirect.
- [ ] **A.2** Da anonimo apri `/dashboard?tab=1`: redirect a `/auth/login?callbackUrl=%2Fdashboard%3Ftab%3D1`.
- [ ] **A.3** Da anonimo apri `/admin` e `/user/change-password`: redirect al login con il rispettivo `callbackUrl`.
- [ ] **A.4** Da anonimo apri `/api/demo/me`: JSON `{"error":"Unauthorized"}`, status 401 (DevTools → Network).
- [ ] **A.5** Da loggato apri `/auth/login` e `/auth/register`: redirect alla tua pagina di atterraggio, senza vedere il form.
- [ ] **A.6** `/auth/error?error=state_mismatch`: messaggio in italiano, pulsante "Riprova" verso il login.

## B. Registrazione e verifica email

- [ ] **B.1** Su `/auth/register` lascia il nome vuoto, poi un'email non valida, poi una password debole (es. `password`): ogni volta un messaggio specifico, nessuna richiesta inviata.
- [ ] **B.2** Password e conferma diverse: "Le password non coincidono".
- [ ] **B.3** Prova una password per ogni regola mancante (senza maiuscola, senza minuscola, senza numero, senza carattere speciale, meno di 8 caratteri): il messaggio cita la regola giusta.
- [ ] **B.4** Registrati con `X` e una password valida: pagina "Verifica la tua email" con l'indirizzo. In console e in `.dev-mailbox.jsonl` compare "Conferma il tuo indirizzo email".
- [ ] **B.5** Prima di cliccare il link, fai login con `X`: errore "Devi verificare la tua email…" con link "Invia di nuovo". Arriva un **nuovo** link di verifica.
- [ ] **B.6** Clicca il link di verifica: login automatico e atterraggio su `/dashboard`, che mostra "Account in attesa di approvazione" (ruolo NUOVO). Il menu mostra il nome e il badge `NUOVO`.
- [ ] **B.7** Riapri lo stesso link già usato, oppure modifica il token nell'URL: pagina "Verifica la tua email" con "link non valido o scaduto" e pulsante "Invia di nuovo" funzionante.
- [ ] **B.8** Registrati con una `callbackUrl`: apri da anonimo `/admin` → login → "Registrati" (il link conserva `callbackUrl`) → registrati con `Y` → clicca il link di verifica: dopo la verifica arrivi su `/admin`, dove `Y` (NUOVO) vede "in attesa di approvazione".
- [ ] **B.9** Registrati di nuovo con `X` (già esistente): stessa pagina "Verifica la tua email" di B.4, **nessun** errore visibile. In mailbox arriva "Hai già un account" con i link al login e a "Imposta o reimposta la password". In Adminer c'è ancora un solo utente `X`.
- [ ] **B.10** Registrati con `G` dopo aver già fatto login con Google (caso del feedback): come B.9, arriva "Hai già un account", nessun nuovo utente.

## C. Login email e password

- [ ] **C.1** Login con l'ADMIN di seed: atterraggio su `/admin`.
- [ ] **C.2** Logout, poi login ADMIN partendo da `/dashboard` (redirect al login con callbackUrl): dopo il login sei su `/dashboard`, non su `/admin`.
- [ ] **C.3** Password errata: "Email o password non corretti." Email inesistente: **stesso** messaggio.
- [ ] **C.4** Il pulsante occhio di `PasswordInput` mostra e nasconde la password e non ruba il focus con Tab.
- [ ] **C.5** Su `/auth/login?callbackUrl=https://evil.com` fai login: atterri sulla tua pagina di ruolo, mai su evil.com. Ripeti con `callbackUrl=//evil.com` e `callbackUrl=/%2F%2Fevil.com`.

## D. Google

Richiede `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, con i redirect URI registrati (INTEGRATION §5).

- [ ] **D.1** Nuovo utente: "Accedi con Google" → scelta dell'account (`select_account`) → atterraggio su `/dashboard` con ruolo NUOVO. In Adminer: `emailVerified = true`, un `account` con `providerId = google`.
- [ ] **D.2** Login Google partendo da `/admin?x=1` da anonimo: dopo Google torni su `/admin?x=1`.
- [ ] **D.3** Annulla sulla schermata di Google: torni a `/auth/error` con un messaggio comprensibile (es. "Accesso annullato…").
- [ ] **D.4** Senza le env Google (svuotale e riavvia): il pulsante Google sparisce da login e registrazione, così come il separatore "oppure" se non ci sono altri provider.
- [ ] **D.5** Il consent screen mostra il nome dell'app corretto (non quello di un altro progetto).

## E. Collegamento account (stessa email)

- [ ] **E.1** Email verificata e poi Google: registra e verifica `G` con email+password, poi fai logout e "Accedi con Google" con `G`. Risultato: un solo utente, con 2 righe `account` (`credential` e `google`). Funzionano entrambi i login.
- [ ] **E.2** Prima Google, poi password: dopo D.1 usa "Password dimenticata" con `G` e imposta una password. Poi fai login con email e password. Risultato: un solo utente, con un `account` `credential` in più.
- [ ] **E.3** Protezione da takeover: registra `G` con email+password ma **non** verificarla, poi prova "Accedi con Google" con `G`. Il collegamento viene rifiutato: finisci su `/auth/error` con "Esiste già un account con questa email non ancora verificato…" (codice `account_not_linked`). Nessun `account` google creato.

## F. OIDC generico (es. IBM w3id preprod)

Richiede `OIDC_*` configurate e il redirect URI `{BETTER_AUTH_URL}/api/auth/callback/{OIDC_PROVIDER_ID}` registrato presso l'IdP.

- [ ] **F.1** Compare il pulsante "Accedi con {OIDC_LABEL}".
- [ ] **F.2** Login completo: atterraggio per ruolo; utente con `emailVerified = true` e `account.providerId = {OIDC_PROVIDER_ID}`.
- [ ] **F.3** Stessa email di un utente esistente verificato: collegamento automatico, come in E.1.
- [ ] **F.4** Senza le env OIDC il pulsante non compare.

## G. Password dimenticata e reset

- [ ] **G.1** Con un'email registrata: messaggio "Se l'indirizzo è registrato…" e arriva l'email "Reimposta la tua password".
- [ ] **G.2** Con un'email **non** registrata: **stesso** messaggio, nessuna email, tempo di risposta simile.
- [ ] **G.3** Il link apre `/auth/reset-password?token=…`. Una password debole viene rifiutata; una valida porta al login con "Password aggiornata".
- [ ] **G.4** La vecchia password non funziona più, la nuova sì.
- [ ] **G.5** Revoca delle sessioni: sii loggato con lo stesso utente in un altro browser, esegui il reset e ricarica l'altro browser. Quella sessione è scaduta (redirect al login).
- [ ] **G.6** Riusa lo stesso link di reset: "Il link non è valido o è scaduto" con "Richiedi un nuovo link".
- [ ] **G.7** Apri `/auth/reset-password` senza token: messaggio di link non valido.

## H. Cambio password

- [ ] **H.1** Utente con password: password attuale errata → errore; nuova uguale all'attuale → errore; nuova debole → errore; caso valido → "Password aggiornata".
- [ ] **H.2** Dopo il cambio la sessione corrente resta attiva, mentre quella in un altro browser viene disconnessa.
- [ ] **H.3** Utente solo Google: la pagina mostra il messaggio "usa un provider esterno" e il link "Imposta una password" verso "Password dimenticata".
- [ ] **H.4** Un utente NUOVO può aprire `/user/change-password` (non vede "in attesa di approvazione").

## I. Ruoli e autorizzazione

- [ ] **I.1** NUOVO: `/dashboard` e `/admin` mostrano "in attesa di approvazione". `/api/demo/me` → 200; `/api/demo/admin` → 403.
- [ ] **I.2** Da ADMIN, in `/admin`, porta un utente a `USER`. Senza che l'utente rifaccia il login, al reload `/dashboard` mostra la dashboard, `/admin` mostra "Accesso negato" e `/api/demo/admin` risponde 403.
- [ ] **I.3** Porta l'utente ad `ADMIN`: al reload vede `/admin` e il link "Admin" nell'header. Riportalo a USER: perde l'accesso subito.
- [ ] **I.4** Nella riga del proprio utente, l'ADMIN non ha il selettore del ruolo.
- [ ] **I.5** Bootstrap admin: aggiungi un'email nuova a `AUTH_ADMIN_EMAILS`, riavvia e registrala. Dopo la verifica il ruolo è ADMIN. Un utente **già esistente** aggiunto alla lista non viene promosso (comportamento atteso).
- [ ] **I.6** Il ruolo non si può forzare in registrazione: invia `POST /api/auth/sign-up/email` con `"role":"ADMIN"` nel body (DevTools o curl). L'utente creato ha comunque il ruolo NUOVO, oppure la richiesta viene rifiutata.

## J. Logout e sessioni

- [ ] **J.1** "Esci" dal menu: torni alla home come anonimo; `/dashboard` reindirizza di nuovo al login.
- [ ] **J.2** Dopo il logout il tasto "indietro" del browser non mostra contenuti riservati utilizzabili: un reload reindirizza al login.
- [ ] **J.3** Elimina un utente da Adminer mentre è loggato: al reload successivo risulta anonimo.

## K. Sicurezza

- [ ] **K.1** Rate limit (con `AUTH_RATE_LIMIT=on`): 6 login errati di fila entro un minuto. Il sesto mostra "Troppi tentativi. Riprova tra qualche minuto."
- [ ] **K.2** Cookie (DevTools → Application → Cookies): `better-auth.session_token` ha `HttpOnly` e `SameSite=Lax`. In produzione HTTPS il nome ha il prefisso `__Secure-` ed è `Secure`.
- [ ] **K.3** Header di risposta: presenti `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy`.
- [ ] **K.4** CSRF: una `POST /api/auth/sign-in/email` con header `Origin: https://evil.com` viene rifiutata (403).
- [ ] **K.5** Server action protetta: da un utente USER, provare a chiamare `setUserRole` (es. replicando dal Network tab la richiesta fatta da un ADMIN) fallisce e il ruolo non cambia.
- [ ] **K.6** Nessun segreto nel bundle client: cerca `GOOGLE_CLIENT_SECRET` / `BETTER_AUTH_SECRET` nei file di `.next/static` dopo la build → nessuna occorrenza dei valori.

## L. Email reali (produzione o staging)

- [ ] **L.1** Resend: dominio *Verified*, `EMAIL_PROVIDER=resend`. Le email di verifica, reset e "hai già un account" arrivano in **inbox** (non in spam) su Gmail e Outlook.
- [ ] **L.2** Header della mail ricevuta ("Mostra originale" in Gmail): `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
- [ ] **L.3** I link nelle email puntano a `BETTER_AUTH_URL` (dominio di produzione, non localhost).
- [ ] **L.4** SendGrid (se usato): stesse verifiche di L.1–L.3 con `EMAIL_PROVIDER=sendgrid`.
- [ ] **L.5** API key errata: la registrazione risponde comunque OK all'utente e nei log compare `[auth] invio email … fallito`.

## M. Build di produzione

- [ ] **M.1** `npm run build && npm start`: l'app funziona come in dev (ripeti A.1, C.1, B.4).
- [ ] **M.2** Con `NODE_ENV=production` e `BETTER_AUTH_SECRET` vuoto o più corto di 32 caratteri l'app non parte, con un messaggio chiaro.
- [ ] **M.3** Senza `EMAIL_PROVIDER` in produzione l'invio fallisce con un log esplicito (in produzione non c'è il default `console`).
- [ ] **M.4** Deploy su un dominio con `www`: senza `TRUSTED_ORIGINS` il login dall'host alternativo dà `INVALID_ORIGIN`; dopo averlo aggiunto funziona.

## N. Adozione in un progetto nuovo

- [ ] **N.1** In un `create-next-app` pulito copia i file di [MANIFEST.md](../MANIFEST.md) e segui la checklist di [INTEGRATION.md §1](../INTEGRATION.md#1-checklist-di-adozione). Tempo impiegato e passaggi poco chiari vanno annotati come feedback sulla doc.
- [ ] **N.2** Cambia ruoli e `landingForRole` in `config.ts` (es. aggiungi `MANAGER`): typecheck ok, il nuovo ruolo compare in `/admin` e l'atterraggio rispetta la nuova regola.
- [ ] **N.3** Aggiungi un campo nel blocco `APP FIELDS` dello schema e lancia la migration: l'autenticazione continua a funzionare.

---

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

Il template è **funzionante** quando le sezioni 0 e A–K sono OK. L, M ed N vanno completate prima del primo progetto in produzione.
