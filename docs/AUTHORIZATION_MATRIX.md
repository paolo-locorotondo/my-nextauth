# Authorization Matrix

> **Template.** Copialo nel progetto e tienilo aggiornato. La sorgente di verità
> sono le chiamate `validateAuth(request, ...)` nelle `route.ts` (API),
> `<AuthGate>` / `validateAuthFromServerSession(...)` nelle `page.tsx`,
> `requireRole(...)` nelle server action, più `PROTECTED_PREFIXES` in
> [lib/auth/config.ts](../lib/auth/config.ts) (letto da [proxy.ts](../proxy.ts)).
> In caso di dubbio leggi il codice: questa matrice può essere out-of-date.
>
> **Quando aggiungi o modifichi una rotta protetta, aggiorna questo file nello stesso commit.**

## Legenda

| Simbolo | Significato |
|---|---|
| ✅ | Accesso consentito (logica di business permettendo) |
| ⏳ | La pagina mostra `PendingApproval` (ruolo in `PENDING_ROLES`, es. NUOVO) |
| ❌ | La pagina mostra `AccessDenied` |
| 🔒 | L'API risponde 403 Forbidden |
| ↪ | Il proxy reindirizza a `/auth/login?callbackUrl=...` (307); le API rispondono 401 |

Ruoli (in `ROLES` di `lib/auth/config.ts`):
- **GUEST**: non autenticato (nessuna sessione)
- **NUOVO**: appena registrato (email, Google o OIDC), in attesa di approvazione
- **USER**: utente approvato
- **ADMIN**: gestisce gli utenti

> Nota: un utente NUOVO su una pagina riservata ad altri ruoli vede ⏳, non ❌
> (prima deve essere approvato). Vedi `check()` in `lib/auth/helpers.ts`.

## Pagine (demo)

| Path | GUEST | NUOVO | USER | ADMIN |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/auth/login`, `/auth/register` | ✅ | ↪ continue | ↪ continue | ↪ continue |
| `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/error` | ✅ | ✅ | ✅ | ✅ |
| `/auth/continue` | ↪ login | → `/dashboard` | → `/dashboard` | → `/admin/users` |
| `/dashboard` | ↪ | ⏳ | ✅ | ✅ |
| `/admin` (redirect a `/admin/users`), `/admin/users`, `/admin/allowed-emails` | ↪ | ⏳ | ❌ | ✅ |
| `/user/change-password` | ↪ | ✅ (cred) / link "imposta password" (solo OAuth) | idem | idem |

## API

| Method + Path | GUEST | NUOVO | USER | ADMIN |
|---|---|---|---|---|
| `* /api/auth/*` (Better Auth) | ✅ | ✅ | ✅ | ✅ |
| `GET /api/demo/me` | 401 | ✅ (`allowPending`) | ✅ | ✅ |
| `GET /api/demo/admin` | 401 | 🔒 | 🔒 | ✅ |

Con `AUTH_ALLOWLIST=on` registrazione e login sono limitati alla white list (vedi INTEGRATION §16): un'email fuori lista non arriva a nessuna delle rotte sopra. Gli admin in `AUTH_ADMIN_EMAILS` e nel DB sono sempre ammessi.

## Server action

| Action | GUEST | NUOVO | USER | ADMIN |
|---|---|---|---|---|
| `setUserRole` (`app/admin/users/actions.ts`) | AuthError | AuthError | AuthError | ✅ (non sul proprio utente) |
| `deleteUser` (`app/admin/users/actions.ts`) | AuthError | AuthError | AuthError | ✅ (non sul proprio utente né sugli admin di `AUTH_ADMIN_EMAILS`) |
| `addAllowedEmail`, `removeAllowedEmail` (`app/admin/allowed-emails/actions.ts`) | AuthError | AuthError | AuthError | ✅ |
