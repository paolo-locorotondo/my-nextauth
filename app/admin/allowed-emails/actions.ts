"use server";

import { revalidatePath } from "next/cache";
import { ALLOWLIST_LIMITS, allowlistPatternSchema, matchesAllowlist } from "@/lib/auth/allowlist-rules";
import { ADMIN_ROLES } from "@/lib/auth/config";
import { validateAuthFromServerSession } from "@/lib/auth/helpers";
import { env } from "@/lib/auth/env";
import { prisma } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/allowed-emails";
const NO_PERMISSION = "Non hai più i permessi per questa operazione: ricarica la pagina.";

/** Aggiunge una voce alla white list (email esatta o @dominio). */
export async function addAllowedEmail(rawPattern: string, note?: string): Promise<ActionResult> {
  const guard = await validateAuthFromServerSession(ADMIN_ROLES);
  if (!guard.ok) return { ok: false, error: NO_PERMISSION };

  const parsed = allowlistPatternSchema.safeParse(rawPattern);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Voce non valida" };

  const trimmed = note?.trim() ?? "";
  if (trimmed.length > ALLOWLIST_LIMITS.note) return { ok: false, error: `La nota può avere al massimo ${ALLOWLIST_LIMITS.note} caratteri` };

  const exists = await prisma.allowedEmail.findUnique({ where: { pattern: parsed.data }, select: { id: true } });
  if (exists) return { ok: false, error: "Questa voce è già in lista" };

  await prisma.allowedEmail.create({ data: { pattern: parsed.data, note: trimmed || null } });
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Revoca le sessioni aperte degli utenti che la voce `pattern` (appena rimossa o cambiata) ammetteva
 * e che nessuna voce rimasta ammette più: senza questo, una sessione già attiva resterebbe valida fino
 * alla scadenza. Gli admin di bootstrap, i ruoli admin e `actorId` restano esclusi.
 */
async function revokeSessionsOfRemoved(pattern: string, actorId: string) {
  const isDomain = pattern.startsWith("@");
  const affected = await prisma.user.findMany({
    where: {
      AND: [
        isDomain ? { email: { endsWith: pattern } } : { email: pattern },
        { email: { notIn: env.adminEmails } },
        { role: { notIn: [...ADMIN_ROLES] } },
        { NOT: { id: actorId } },
      ],
    },
    select: { id: true, email: true },
  });

  // Ricontrolla ogni utente: un'altra voce (email o dominio) potrebbe ancora ammetterlo
  const stillAllowed = await prisma.allowedEmail.findMany({ select: { pattern: true } });
  const patterns = stillAllowed.map((a) => a.pattern);
  const toRevoke = affected.filter((u) => !matchesAllowlist(u.email, patterns));

  if (toRevoke.length) {
    await prisma.session.deleteMany({ where: { userId: { in: toRevoke.map((u) => u.id) } } });
  }
}

/** Rimuove una voce e revoca le sessioni di chi non è più ammesso (vedi `revokeSessionsOfRemoved`). */
export async function removeAllowedEmail(id: string): Promise<ActionResult> {
  const guard = await validateAuthFromServerSession(ADMIN_ROLES);
  if (!guard.ok) return { ok: false, error: NO_PERMISSION };

  const entry = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!entry) return { ok: false, error: "Voce non trovata" };

  await prisma.allowedEmail.delete({ where: { id } });
  await revokeSessionsOfRemoved(entry.pattern, guard.user.id);

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Cambia voce e nota di una voce esistente. Se la voce cambia, gli utenti ammessi solo dalla vecchia
 * perdono le sessioni aperte (stesse esclusioni della rimozione).
 */
export async function updateAllowedEmail(id: string, rawPattern: string, note?: string): Promise<ActionResult> {
  const guard = await validateAuthFromServerSession(ADMIN_ROLES);
  if (!guard.ok) return { ok: false, error: NO_PERMISSION };

  const parsed = allowlistPatternSchema.safeParse(rawPattern);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Voce non valida" };

  const trimmed = note?.trim() ?? "";
  if (trimmed.length > ALLOWLIST_LIMITS.note) return { ok: false, error: `La nota può avere al massimo ${ALLOWLIST_LIMITS.note} caratteri` };

  const entry = typeof id === "string" ? await prisma.allowedEmail.findUnique({ where: { id } }) : null;
  if (!entry) return { ok: false, error: "Voce non trovata: ricarica la pagina." };

  if (parsed.data !== entry.pattern) {
    const exists = await prisma.allowedEmail.findUnique({ where: { pattern: parsed.data }, select: { id: true } });
    if (exists) return { ok: false, error: "Questa voce è già in lista" };
  }

  await prisma.allowedEmail.update({ where: { id }, data: { pattern: parsed.data, note: trimmed || null } });
  if (parsed.data !== entry.pattern) await revokeSessionsOfRemoved(entry.pattern, guard.user.id);

  revalidatePath(PATH);
  return { ok: true };
}
