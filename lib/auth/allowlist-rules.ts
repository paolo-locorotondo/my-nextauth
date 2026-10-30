import { z } from "zod";

/**
 * Regole della white list, pure: nessun DB né env, quindi testabili con node --test.
 * La parte che interroga il DB sta in allowlist.ts.
 */

/** Normalizza un'email per il confronto: minuscolo e senza spazi ai bordi. */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/** Dominio di un'email ("mario@x.it" → "@x.it"), o null se non è un'email. */
export function domainPattern(email: string): string | null {
  const at = email.lastIndexOf("@");
  return at > 0 ? email.slice(at) : null;
}

/** true se l'email corrisponde a una voce (esatta o dominio). Le voci sono già in minuscolo. */
export function matchesAllowlist(email: string, patterns: readonly string[]): boolean {
  const e = normalizeEmail(email);
  const domain = domainPattern(e);
  return patterns.some((p) => p === e || (domain !== null && p === domain));
}

/** Lunghezze massime della white list: 254 è il tetto di un indirizzo email (RFC 5321). */
export const ALLOWLIST_LIMITS = { pattern: 254, note: 200 } as const;

/** Voce valida: email esatta oppure "@dominio.tld". Salvata in minuscolo. */
export const allowlistPatternSchema = z
  .string()
  .max(ALLOWLIST_LIMITS.pattern, `Massimo ${ALLOWLIST_LIMITS.pattern} caratteri`)
  .transform(normalizeEmail)
  .refine(
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^@[^\s@]+\.[^\s@]+$/.test(v),
    "Inserisci un'email (mario@x.it) oppure un dominio (@x.it)",
  );
