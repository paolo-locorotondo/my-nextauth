# Mappa del sito

Albero delle pagine con i ruoli che le vedono. I dettagli di accesso (azioni, API) stanno in [AUTHORIZATION_MATRIX.md](AUTHORIZATION_MATRIX.md). **Ogni nuova pagina o spostamento aggiorna questo file nello stesso commit.**

Un utente NUOVO vede sempre l'attesa di approvazione.

```
/                               pubblica
├── auth/…                      login, registrazione, recupero password, verifica email
├── dashboard                   tutti gli utenti approvati
├── admin                       ADMIN    solo redirect a users; nel menu è un gruppo che apre la tendina
│   ├── users                   ADMIN    utenti, ruoli, eliminazione
│   └── allowed-emails          ADMIN    white list delle email
└── user/change-password        tutti gli autenticati
```

Le voci di menu con sottovoci (come "Admin") non sono link: il clic apre la tendina. La pagina radice del gruppo fa solo redirect alla prima sottovoce, così un indirizzo digitato a mano non dà 404.
