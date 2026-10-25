/**
 * Accesso al DB dai test E2E. Il client Prisma generato usa import.meta e non si carica nel
 * runner di Playwright (CommonJS): le operazioni girano in un processo figlio (tsx).
 */
import { runTs } from "../helpers/child";

export function dbRun(body: string): string {
  const code = `import "dotenv/config";
import * as mod from "./app/generated/prisma/client";
const { PrismaClient } = (mod.PrismaClient ? mod : mod.default);
const prisma = new PrismaClient();
try { ${body} } finally { await prisma.$disconnect(); }`;
  const r = runTs(code, { DATABASE_URL: process.env.DATABASE_URL });
  if (r.status !== 0) throw new Error(`dbRun fallito: ${r.stderr || r.stdout}`);
  return r.stdout;
}

export const verifyUser = (email: string) =>
  dbRun(`await prisma.user.update({ where: { email: ${JSON.stringify(email)} }, data: { emailVerified: true } });`);

export const deleteUsers = (emails: string[]) =>
  dbRun(`await prisma.user.deleteMany({ where: { email: { in: ${JSON.stringify(emails)} } } });`);

export const prepareUser = (email: string, role: string) =>
  dbRun(`await prisma.user.update({ where: { email: ${JSON.stringify(email)} }, data: { emailVerified: true, role: ${JSON.stringify(role)} } });`);

export const countUsers = (email: string) =>
  Number(dbRun(`console.log(await prisma.user.count({ where: { email: ${JSON.stringify(email)} } }));`).trim());

export const countRelated = (userId: string) =>
  dbRun(`console.log(JSON.stringify({
  sessions: await prisma.session.count({ where: { userId: ${JSON.stringify(userId)} } }),
  accounts: await prisma.account.count({ where: { userId: ${JSON.stringify(userId)} } }),
}));`).trim();

export const getRole = (email: string) =>
  dbRun(`console.log((await prisma.user.findUnique({ where: { email: ${JSON.stringify(email)} }, select: { role: true } }))?.role ?? "");`).trim();

export const deleteAllowedByNote = (note: string) =>
  dbRun(`await prisma.allowedEmail.deleteMany({ where: { note: ${JSON.stringify(note)} } });`);

export const addAllowed = (pattern: string, note: string) =>
  dbRun(`await prisma.allowedEmail.upsert({ where: { pattern: ${JSON.stringify(pattern)} }, update: {}, create: { pattern: ${JSON.stringify(pattern)}, note: ${JSON.stringify(note)} } });`);
