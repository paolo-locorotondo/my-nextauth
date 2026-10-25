# Suite di test

| Cartella | Comando | Richiede | Contenuto |
|---|---|---|---|
| `unit/` | `npm test` | niente | Funzioni pure: redirect sicuri, password policy, ruoli, white list |
| `config/` | `npm run test:config` | niente | Avvio con env sbagliate (M.2), provider email mancanti o che rispondono 401 (M.3, L.5) |
| `db/` | `npm run test:db` | Postgres | `deleteUserAndData` (parte DB di I.7) |
| `http/` | `npm run test:http` | server in esecuzione + DB | Sicurezza: header (K.3), Origin/CSRF (M.4), ruolo (I.6), anti-enumerazione (G.2), token reset (G.7), sessioni (J.3, I.3), white list |
| `smoke/` | `npm run smoke` | server in esecuzione + DB | Flusso completo registrazione, verifica, login, reset, cambio password, rate limit |
| `e2e/` | `npm run test:e2e` | Postgres + browser Chromium (`npx playwright install chromium`) | Tutte le pagine nel browser: sezioni A, B, C, G, H, I, J, K, O |
| `tools/` | `node test/tools/check-secrets.mjs` | dopo `npm run build` | Nessun segreto nel bundle (K.6) |
| `helpers/` | — | — | Client HTTP, lettura email, white list di prova, processo figlio |

## E2E (Playwright)

`npm run test:e2e` avvia da sé i server di sviluppo sulla porta 3100 (non tocca quello su 3000) e li
configura con le variabili che servono, in tre profili eseguiti uno dopo l'altro
(due `next dev` nella stessa cartella non possono convivere):

| Profilo | Env | Spec |
|---|---|---|
| `default` | rate limit e white list spenti | tutte tranne le due sotto |
| `ratelimit` | `AUTH_RATE_LIMIT=on` | `k-ratelimit` |
| `allowlist` | `AUTH_ALLOWLIST=on`, `AUTH_ADMIN_EMAILS` | `o-allowlist` |

Un solo profilo: `E2E_PROFILE=allowlist npx playwright test`. Un solo file: `npm run test:e2e -- b-register`.
La porta 3100 deve essere libera. Le email di verifica e reset si leggono da `.dev-mailbox.jsonl`
(`EMAIL_PROVIDER=console`). Il DB è quello di `.env` con il seed (`npm run db:seed`); i test creano e
cancellano i propri utenti.

## Server per `http/` e `smoke/`

`EMAIL_PROVIDER=console`, `AUTH_RATE_LIMIT=on`, `AUTH_ALLOWLIST` vuoto
(con `AUTH_ALLOWLIST=on` lo smoke esegue anche i 4 step della white list).

Quali test manuali sono coperti: [coverage-map.md](coverage-map.md). I test manuali rimasti sono in
[manual-test-plan.md](manual-test-plan.md).
