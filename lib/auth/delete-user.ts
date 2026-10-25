import type { PrismaClient } from "@/app/generated/prisma/client";

/**
 * Elimina un utente e tutti i suoi dati di autenticazione.
 *
 * - `session` e `account` cadono da soli: hanno la FK `ON DELETE CASCADE` verso `user`.
 * - `verification` NON ha nessuna FK verso `user`: i token di reset password pendenti
 *   hanno `value = userId` e vanno tolti a mano, altrimenti resterebbero fino alla scadenza.
 *
 * Se il progetto aggiunge relazioni a `User` (blocco APP FIELDS dello schema), dichiaralo
 * con `onDelete: Cascade` nella relazione oppure cancella qui le righe collegate:
 * tutto nella stessa transazione.
 *
 * Non fa nessun controllo di autorizzazione: va chiamata solo dopo `requireRole`.
 */
export async function deleteUserAndData(db: PrismaClient, userId: string): Promise<void> {
  await db.$transaction([
    db.verification.deleteMany({ where: { value: userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}
