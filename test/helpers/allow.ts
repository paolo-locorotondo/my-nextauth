import type { PrismaClient } from "../../app/generated/prisma/client";

const NOTE = "test-suite";

/** Ammette @example.com per gli utenti di prova. No-op a white list spenta (la voce resta inerte). */
export async function allowTestDomain(prisma: PrismaClient) {
  await prisma.allowedEmail.upsert({ where: { pattern: "@example.com" }, update: {}, create: { pattern: "@example.com", note: NOTE } });
}

/** Toglie la voce solo se l'ha creata la suite (non una voce inserita a mano dall'utente). */
export async function releaseTestDomain(prisma: PrismaClient) {
  await prisma.allowedEmail.deleteMany({ where: { pattern: "@example.com", note: NOTE } });
}
