/**
 * Tutti i testi dell'autenticazione (UI + email). Per tradurre l'app basta
 * creare un altro oggetto con la stessa forma (AuthTexts) ed esportarlo qui.
 */

export const texts = {
  common: {
    email: "Email",
    password: "Password",
    name: "Nome",
    or: "oppure",
    loading: "Attendere...",
    backToLogin: "Torna al login",
    backToHome: "Torna alla home",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
  },
  login: {
    title: "Accedi",
    subtitle: "Accedi al tuo account",
    submit: "Accedi",
    withGoogle: "Accedi con Google",
    withProvider: (label: string) => `Accedi con ${label}`,
    forgotPassword: "Password dimenticata?",
    noAccount: "Non hai un account?",
    register: "Registrati",
    resendVerification: "Invia di nuovo l'email di verifica",
    verificationSent: "Ti abbiamo inviato una nuova email di verifica.",
    passwordUpdated: "Password aggiornata. Accedi con la nuova password.",
  },
  register: {
    title: "Crea un account",
    submit: "Registrati",
    confirmPassword: "Conferma password",
    passwordMismatch: "Le password non coincidono",
    haveAccount: "Hai già un account?",
    login: "Accedi",
  },
  verifyEmail: {
    title: "Verifica la tua email",
    checkInbox: (email: string | null) =>
      email
        ? `Abbiamo inviato un'email a ${email}. Se l'indirizzo è nuovo contiene il link per attivare l'account; se hai già un account, contiene le istruzioni per accedere.`
        : "Ti abbiamo inviato un'email. Se l'indirizzo è nuovo contiene il link per attivare l'account; se hai già un account, contiene le istruzioni per accedere.",
    invalidToken: "Il link di verifica non è valido o è scaduto. Richiedine uno nuovo.",
    resend: "Invia di nuovo",
    resent: "Email inviata. Controlla la tua casella (anche lo spam).",
  },
  forgotPassword: {
    title: "Password dimenticata",
    intro: "Inserisci la tua email: se esiste un account ti invieremo un link per impostare una nuova password.",
    submit: "Invia link",
    sent: "Se l'indirizzo è registrato riceverai a breve un'email con il link per reimpostare la password.",
  },
  resetPassword: {
    title: "Nuova password",
    newPassword: "Nuova password",
    submit: "Imposta password",
    invalidToken: "Il link non è valido o è scaduto.",
    requestNew: "Richiedi un nuovo link",
  },
  changePassword: {
    title: "Cambia password",
    currentPassword: "Password attuale",
    newPassword: "Nuova password",
    confirmPassword: "Conferma nuova password",
    submit: "Aggiorna password",
    success: "Password aggiornata. Le altre sessioni sono state disconnesse.",
    samePassword: "La nuova password deve essere diversa da quella attuale",
    noCredential:
      "Il tuo account usa l'accesso con un provider esterno (es. Google) e non ha una password. Puoi impostarne una tramite il link via email.",
    setPassword: "Imposta una password",
  },
  error: {
    title: "Errore di autenticazione",
    retry: "Riprova",
  },
  pending: {
    title: "Account in attesa di approvazione",
    body: "Il tuo account è stato creato ma deve essere abilitato da un amministratore. Riceverai accesso appena verrà approvato.",
  },
  denied: {
    title: "Accesso negato",
    body: "Non hai i permessi necessari per visualizzare questa pagina.",
  },
  userMenu: {
    greeting: (name: string) => `Ciao, ${name}`,
    changePassword: "Cambia password",
    signOut: "Esci",
    signIn: "Accedi",
    signUp: "Registrati",
  },
  password: {
    min: (n: number) => `La password deve contenere almeno ${n} caratteri`,
    max: (n: number) => `La password non può superare ${n} caratteri`,
    upper: "La password deve contenere almeno una lettera maiuscola",
    lower: "La password deve contenere almeno una lettera minuscola",
    digit: "La password deve contenere almeno un numero",
    special: "La password deve contenere almeno un carattere speciale",
  },
  validation: {
    email: "Inserisci un indirizzo email valido",
    name: "Inserisci il tuo nome",
    password: "Inserisci la password",
    currentPassword: "Inserisci la password attuale",
  },
  /** Codici di errore di Better Auth (API e redirect OAuth) → messaggio. */
  errors: {
    INVALID_EMAIL_OR_PASSWORD: "Email o password non corretti.",
    EMAIL_NOT_VERIFIED: "Devi verificare la tua email prima di accedere. Ti abbiamo inviato un nuovo link.",
    USER_ALREADY_EXISTS: "Esiste già un account con questa email.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Esiste già un account con questa email.",
    INVALID_EMAIL: "Indirizzo email non valido.",
    INVALID_PASSWORD: "La password attuale non è corretta.",
    PASSWORD_TOO_SHORT: "La password è troppo corta.",
    PASSWORD_TOO_LONG: "La password è troppo lunga.",
    PASSWORD_POLICY: "La password non rispetta i requisiti di sicurezza.",
    INVALID_TOKEN: "Il link non è valido o è scaduto.",
    TOKEN_EXPIRED: "Il link è scaduto.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "Questo account non ha una password.",
    SESSION_EXPIRED: "Sessione scaduta: accedi di nuovo.",
    TOO_MANY_REQUESTS: "Troppi tentativi. Riprova tra qualche minuto.",
    INVALID_CALLBACK_URL: "Indirizzo di ritorno non valido.",
    EMAIL_NOT_ALLOWED: "Questo indirizzo email non è autorizzato ad accedere. Contatta l'amministratore.",
    email_not_allowed: "Questo indirizzo email non è autorizzato ad accedere. Contatta l'amministratore.",
    INVALID_ORIGIN: "Richiesta non valida (origine non consentita).",
    account_not_linked:
      "Esiste già un account con questa email non ancora verificato. Accedi con email e password, verifica l'indirizzo e riprova.",
    unable_to_link_account: "Impossibile collegare questo account a quello esistente.",
    email_not_found: "Il provider non ha restituito un indirizzo email.",
    state_mismatch: "Sessione di accesso non valida. Riprova.",
    state_not_found: "Sessione di accesso scaduta. Riprova.",
    invalid_callback_request: "Richiesta di accesso non valida. Riprova.",
    oauth_provider_not_found: "Metodo di accesso non configurato.",
    access_denied: "Accesso annullato o negato dal provider.",
    signup_disabled: "La registrazione non è consentita.",
    invalid_token: "Il link non è valido o è scaduto.",
    token_expired: "Il link è scaduto.",
    internal_server_error: "Errore interno. Riprova più tardi.",
    default: "Si è verificato un errore imprevisto. Riprova.",
  } as Record<string, string>,
  email: {
    verify: {
      subject: "Conferma il tuo indirizzo email",
      heading: "Conferma la tua email",
      body: (name: string) => `Ciao ${name}, clicca sul pulsante qui sotto per confermare il tuo indirizzo email.`,
      cta: "Conferma email",
    },
    reset: {
      subject: "Reimposta la tua password",
      heading: "Reimposta la password",
      body: (name: string) =>
        `Ciao ${name}, abbiamo ricevuto una richiesta di reimpostazione della password. Se non sei stato tu, ignora questa email.`,
      cta: "Reimposta password",
    },
    /** Registrazione con un'email già registrata (es. account Google): nessun nuovo account. */
    existing: {
      subject: "Hai già un account",
      heading: "Hai già un account con questa email",
      body: (name: string) =>
        `Ciao ${name}, qualcuno (probabilmente tu) ha provato a registrarsi con questo indirizzo, ma esiste già un account. Accedi con il metodo che usi di solito (email e password, Google o SSO aziendale). Se non hai una password o non la ricordi, impostane una nuova con il link qui sotto. Se non sei stato tu, ignora questa email.`,
      cta: "Accedi",
      secondary: "Imposta o reimposta la password",
    },
    footer: "Se il pulsante non funziona copia questo indirizzo nel browser:",
  },
};

export type AuthTexts = typeof texts;
