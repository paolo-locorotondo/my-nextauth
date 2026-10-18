import "server-only";
import { prisma } from "@/lib/db";
import { domainPattern, normalizeEmail } from "./allowlist-rules";
import { env } from "./env";
import { isAdmin } from "./roles";

export { allowlistPatternSchema, matchesAllowlist } from "./allowlist-rules";

/**
 * La white list vale per registrazione e login? Sempre true se la funzione è
 * spenta. Sono sempre ammessi gli admin di bootstrap (AUTH_ADMIN_EMAILS) e
 * chiunque abbia già ruolo ADMIN nel DB (es. admin creati dal seed o promossi
 * da /admin): così con una lista vuota non si resta mai fuori.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!env.allowlistEnabled) return true;
  const e = normalizeEmail(email);
  if (env.adminEmails.includes(e)) return true;

  const admin = await prisma.user.findUnique({ where: { email: e }, select: { role: true } });
  if (admin && isAdmin(admin)) return true;

  const domain = domainPattern(e);
  const hit = await prisma.allowedEmail.findFirst({
    where: { pattern: { in: domain ? [e, domain] : [e] } },
    select: { id: true },
  });
  return hit !== null;
}
