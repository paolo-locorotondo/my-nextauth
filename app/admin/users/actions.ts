"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLES } from "@/lib/auth/config";
import { deleteUserAndData } from "@/lib/auth/delete-user";
import { env } from "@/lib/auth/env";
import { validateAuthFromServerSession } from "@/lib/auth/helpers";
import { isRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Pagina rimasta aperta dopo un declassamento o una sessione revocata: errore mostrato nella UI, non un 500
const NO_PERMISSION = "Non hai più i permessi per questa operazione: ricarica la pagina.";

/** Demo: cambio ruolo di un utente. Le server action sono endpoint POST pubblici: SEMPRE il controllo del ruolo. */
export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  const guard = await validateAuthFromServerSession("ADMIN");
  if (!guard.ok) return { ok: false, error: NO_PERMISSION };
  const me = guard.user;

  if (!isRole(role)) return { ok: false, error: "Ruolo non valido" };
  if (userId === me.id) return { ok: false, error: "Non puoi cambiare il tuo ruolo" };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  // La sessione è letta dal DB a ogni richiesta: il nuovo ruolo vale subito
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Demo: elimina un utente con account, sessioni e token pendenti (vedi deleteUserAndData).
 * Le sessioni aperte spariscono insieme alla riga: l'utente è subito anonimo.
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const guard = await validateAuthFromServerSession(ADMIN_ROLES);
  if (!guard.ok) return { ok: false, error: NO_PERMISSION };
  const me = guard.user;

  if (userId === me.id) return { ok: false, error: "Non puoi eliminare il tuo utente" };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!target) return { ok: false, error: "Utente non trovato" };
  // Gli admin di bootstrap si ricreerebbero al primo accesso: l'eliminazione sarebbe solo apparente
  if (env.adminEmails.includes(target.email.toLowerCase())) {
    return { ok: false, error: "Utente protetto da AUTH_ADMIN_EMAILS: rimuovilo dalla variabile prima" };
  }

  await deleteUserAndData(prisma, userId);
  revalidatePath("/admin/users");
  return { ok: true };
}
