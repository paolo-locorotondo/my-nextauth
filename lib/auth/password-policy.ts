import { z } from "zod";
import { PASSWORD_POLICY as P } from "./config";
import { texts } from "./texts";

/** Schema zod della password, condiviso da form client e hook server. */
export const passwordSchema = z
  .string()
  .min(P.min, texts.password.min(P.min))
  .max(P.max, texts.password.max(P.max))
  .refine((v) => !P.upper || /[A-Z]/.test(v), texts.password.upper)
  .refine((v) => !P.lower || /[a-z]/.test(v), texts.password.lower)
  .refine((v) => !P.digit || /\d/.test(v), texts.password.digit)
  .refine((v) => !P.special || /[^A-Za-z0-9]/.test(v), texts.password.special);

/** Restituisce il primo messaggio di errore, oppure null se la password è valida. */
export function passwordError(value: string): string | null {
  const r = passwordSchema.safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? texts.errors.PASSWORD_POLICY);
}

export const emailSchema = z.email(texts.validation.email);
