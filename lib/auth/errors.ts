import { texts } from "./texts";

type BetterAuthClientError = { code?: string; message?: string; status?: number } | null | undefined;

/** Messaggio da mostrare per un codice di errore Better Auth (API o redirect OAuth). */
export function authErrorMessage(code: string | null | undefined): string {
  if (!code) return texts.errors.default;
  return texts.errors[code] ?? texts.errors[code.toUpperCase()] ?? texts.errors.default;
}

/** Messaggio per l'oggetto `error` restituito dal client Better Auth. */
export function clientErrorMessage(error: BetterAuthClientError): string {
  if (!error) return texts.errors.default;
  if (error.status === 429) return texts.errors.TOO_MANY_REQUESTS;
  // Gli errori di policy password (hook server) hanno già un messaggio leggibile
  if (error.code === "PASSWORD_POLICY" && error.message) return error.message;
  return authErrorMessage(error.code);
}
