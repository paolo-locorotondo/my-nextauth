/**
 * Crea (o aggiorna) un utente ADMIN con email+password, già verificato.
 *   npm run db:seed
 * Credenziali da SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (default solo per sviluppo).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
const name = process.env.SEED_ADMIN_NAME || "Admin";

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("In produzione imposta SEED_ADMIN_PASSWORD");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", emailVerified: true },
    create: { id: randomUUID(), email, name, role: "ADMIN", emailVerified: true },
  });

  // Account "credential" = login email+password di Better Auth (hash scrypt)
  const hash = await hashPassword(password);
  const existing = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password: hash } });
  } else {
    await prisma.account.create({
      data: { id: randomUUID(), userId: user.id, providerId: "credential", accountId: user.id, password: hash },
    });
  }

  console.log(`ADMIN pronto: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
