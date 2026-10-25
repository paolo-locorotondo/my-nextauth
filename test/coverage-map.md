# Mappa di copertura: test manuali ↔ test automatici

Serve a rifare i test manuali solo dove serve. Il piano resta [manual-test-plan.md](manual-test-plan.md);
qui non ci sono segni di esecuzione.

**Copertura:** `completa` = l'esito del test manuale è verificato dall'automatico (salta);
`parziale` = l'automatico copre la parte server/API, resta la parte indicata (rifai solo quella);
`manuale` = nessuna copertura automatica.

Sigle: **U** = `npm test` · **C** = `npm run test:config` · **D** = `npm run test:db` ·
**H** = `npm run test:http` (security / sessions / allowlist) · **S** = `npm run smoke` (`SMOKE_ALLOWLIST=on` per i 4 step white list) ·
**T** = `node test/tools/check-secrets.mjs` dopo `npm run build` · **E** = `npm run test:e2e` (browser, avvia da sé i server).

| ID | Copertura | Dove | Cosa resta a mano |
|---|---|---|---|
| 0.1–0.6 | completa | comandi stessi (`typecheck`, `lint`, `test`, `build`, `smoke`) | — |
| A.1, A.2, A.4 | completa | S (pagina pubblica, 307 con callbackUrl, API 401) | — |
| A.3 | completa | E a-access (anche S) | — |
| A.5 | completa | E a-access (testo italiano, pulsante Riprova) + H security | — |
| A.6 | completa | E a-access (login e register da loggato) | — |
| B.1, B.2 | completa | E b-register (messaggi del form) | — |
| B.3 | completa | E b-register + U password-policy + S | — |
| B.4 | completa | E b-register + S | — |
| B.5 | completa | S (403 `EMAIL_NOT_VERIFIED`) | — |
| B.6 | completa | E b-register + S (pagina in attesa di approvazione) | — |
| B.7 | completa | E b-register + S | — |
| B.8 | completa | E b-register (errore e link per reinviare la verifica) | — |
| B.9 | completa | E b-register + S | — |
| B.10 | manuale | — (Google) | tutto |
| C.1 | completa | E c-login + S | — |
| C.2 | completa | E c-login + S | — |
| C.3 | completa | E c-login + H security | — |
| C.4 | completa | E c-login (occhio mostra/nasconde) | — |
| C.5 | completa | E c-login + S + U safe-redirect | — |
| D.1–D.5 | manuale | — (Google reale) | tutto |
| E.1–E.3 | manuale | — (Google reale) | tutto |
| F.1–F.4 | manuale | — (OIDC reale) | tutto (candidati a un OIDC finto, passo 2) |
| G.1 | completa | E g-reset + S | — |
| G.2 | completa | E g-reset + H security | tempi di risposta simili (non verificabile da test) |
| G.3 | completa | E g-reset + S | — |
| G.4 | completa | E g-reset + S | — |
| G.5 | completa | E g-reset + S | — |
| G.6 | completa | E g-reset (riuso del link) | — |
| G.7 | completa | E g-reset + H security | — |
| H.1 | completa | E h-change-password | — |
| H.2 | completa | E h-change-password | — |
| H.3, H.4 | completa | E h-change-password (successo, sessioni altrove revocate, redirect da anonimo) | — |
| I.1 | completa | E i-roles + S | — |
| I.2, I.3 | completa | E i-roles (selettore del ruolo, link Admin, accesso negato) + H sessions | — |
| I.4 | completa | E i-roles | — |
| I.5 | manuale | — (richiede riavvio con env diversa) | tutto |
| I.6 | completa | H security | — |
| I.7 | completa | E i-roles (annulla, conferma, riga sparisce, sessione altrove) + D | — |
| I.8 | parziale | E i-roles (nessun pulsante sulla propria riga) | messaggio "protetto da AUTH_ADMIN_EMAILS" sull'eliminazione di un admin di bootstrap |
| I.9 | completa | E i-roles (375 px, nessuno scroll orizzontale sulla pagina admin) | header, login, registrazione, white list e dashboard a 320–375 px |
| J.1 | completa | E j-logout + S | — |
| J.2 | completa | E j-logout | — |
| J.3 | completa | E j-logout + H sessions | — |
| K.1 | completa | E k-ratelimit (profilo ratelimit) + S | — |
| K.2 | parziale | E k-security (HttpOnly e SameSite=Lax) | prefisso `__Secure-` e `Secure` al primo deploy HTTPS |
| K.3 | completa | H security | — |
| K.4 | completa | H security (403 con `Origin` esterno) | — |
| K.5 | completa | E k-security (richiesta rigiocata da un USER: ruolo invariato) | — |
| K.6 | completa | T (nessun segreto in `.next/static` e `.next/server`) | — |
| L.1, L.2, L.4 | manuale | — (provider e inbox reali) | tutto |
| L.3 | manuale | — | tutto |
| L.5 | completa | C email-provider (401 simulato: non lancia, log `Resend 401`) | — |
| M.1 | manuale | — | tutto |
| M.2 | completa | C env-startup | — |
| M.3 | completa | C email-provider | — |
| M.4 | parziale | H security (403 con origine esterna; 401 con origine dell'app) | prova con `TRUSTED_ORIGINS` su `127.0.0.1` |
| N.1–N.3 | manuale | — | tutto |
| O.1 | completa | S (fuori lista → 403 `EMAIL_NOT_ALLOWED`) | — |
| O.2, O.3 | completa | S (admin entra con lista vuota) | — |
| O.4 | completa | E o-allowlist | — |
| O.5 | completa | E o-allowlist + U allowlist | — |
| O.6 | completa | E o-allowlist + S | — |
| O.7 | manuale | — (Google reale) | tutto |
| O.8 | completa | E o-allowlist + S | — |
| O.9, O.10 | completa | E o-allowlist + H allowlist | — |
| O.11 | completa | E o-allowlist-off | — |
| O.12 | completa | E o-allowlist-off + S senza `SMOKE_ALLOWLIST` | — |

## Da rifare a mano dopo una modifica

Tutte le righe `manuale` e `parziale`. Con **completa** puoi saltare, purché le suite siano verdi.
Il browser (E) copre ormai anche A, B, C, G, H, I, J, K.1/K.5, O; restano a mano i provider reali
(Google, OIDC, email vere) e l'HTTPS di produzione. Con più lavoro si coprirebbero F.* e O.7 con un OIDC finto.
