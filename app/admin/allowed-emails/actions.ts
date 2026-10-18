"use server";

import { revalidatePath } from "next/cache";
import { allowlistPatternSchema, matchesAllowlist } from "@/lib/auth/allowlist-rules";
import { ADMIN_ROLES } from "@/lib/auth/config";
import { requireRole } from "@/lib/auth/helpers";
import { env } from "@/lib/auth/env";
import { prisma } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/admin/allowed-emails";

/** Aggiunge una voce alla white list (email esatta o @dominio). */
export async function addAllowedEmail(rawPattern: string, note?: string): Promise<ActionResult> {
  await requireRole(ADMIN_ROLES);

  const parsed = allowlistPatternSchema.safeParse(rawPattern);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Voce non valida" };

  const exists = await prisma.allowedEmail.findUnique({ where: { pattern: parsed.data }, select: { id: true } });
  if (exists) return { ok: false, error: "Questa voce è già in lista" };

  await prisma.allowedEmail.create({ data: { pattern: parsed.data, note: note?.trim() || null } });
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Rimuove una voce e revoca le sessioni aperte degli utenti che non sono più
 * ammessi: senza questo, una sessione già attiva resterebbe valida fino alla
 * scadenza. Gli admin di bootstrap e chi esegue l'operazione restano esclusi.
 */
export async function removeAllowedEmail(id: string): Promise<ActionResult> {
  const { user: me } = await requireRole(ADMIN_ROLES);

  const entry = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!entry) return { ok: false, error: "Voce non trovata" };

  await prisma.allowedEmail.delete({ where: { id } });

  const isDomain = entry.pattern.startsWith("@");
  const affected = await prisma.user.findMany({
    where: {
      AND: [
        isDomain ? { email: { endsWith: entry.pattern } } : { email: entry.pattern },
        { email: { notIn: env.adminEmails } },
        { role: { notIn: [...ADMIN_ROLES] } },
        { NOT: { id: me.id } },
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

  revalidatePath(PATH);
  return { ok: true };
}
