/**
 * deleteUserAndData contro il DB reale (copre la parte DB di I.7): sessioni e account cadono in cascata,
 * i token di reset (verification, senza FK) vengono tolti a mano. Non serve il server.
 *
 *   npm run test:db
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { PrismaClient } from "../../app/generated/prisma/client";
import { deleteUserAndData } from "../../lib/auth/delete-user";

const prisma = new PrismaClient();
const stamp = Date.now();
const email = `del-${stamp}@example.com`;

after(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.verification.deleteMany({ where: { identifier: { startsWith: `del-${stamp}` } } });
  await prisma.$disconnect();
});

test("elimina utente, sessioni, account e token di reset pendenti", async () => {
  const user = await prisma.user.create({ data: { id: `u-${stamp}`, name: "Del", email, emailVerified: true } });
  const expiresAt = new Date(Date.now() + 3600_000);
  await prisma.session.create({ data: { id: `s-${stamp}`, userId: user.id, token: `t-${stamp}`, expiresAt } });
  await prisma.account.create({ data: { id: `a-${stamp}`, userId: user.id, accountId: user.id, providerId: "credential" } });
  await prisma.verification.create({ data: { id: `v-${stamp}`, identifier: `del-${stamp}-reset`, value: user.id, expiresAt } });

  await deleteUserAndData(prisma, user.id);

  assert.equal(await prisma.user.count({ where: { id: user.id } }), 0);
  assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
  assert.equal(await prisma.account.count({ where: { userId: user.id } }), 0);
  assert.equal(await prisma.verification.count({ where: { value: user.id } }), 0);
});
