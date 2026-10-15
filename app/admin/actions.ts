"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { isRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Demo: cambio ruolo di un utente. Le server action sono endpoint POST pubblici: SEMPRE requireRole. */
export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  const { user: me } = await requireRole("ADMIN");

  if (!isRole(role)) return { ok: false, error: "Ruolo non valido" };
  if (userId === me.id) return { ok: false, error: "Non puoi cambiare il tuo ruolo" };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  // La sessione è letta dal DB a ogni richiesta: il nuovo ruolo vale subito
  revalidatePath("/admin");
  return { ok: true };
}
