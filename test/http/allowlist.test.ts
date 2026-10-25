/**
 * White list contro il server con `AUTH_ALLOWLIST=on` (e AUTH_ADMIN_EMAILS valorizzata).
 * Copre l'esito osservabile di O.9 e O.10; con la funzione spenta i test si saltano.
 * La revoca delle sessioni vera e propria sta nella server action `removeAllowedEmail`
 * (non invocabile fuori da Next): qui si verifica chi può rientrare dopo la rimozione.
 *
 *   npm run test:http
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import { PrismaClient } from "../../app/generated/prisma/client";
import { Client, body } from "../helpers/http";

const prisma = new PrismaClient();
const stamp = Date.now();
const PASSWORD = "List-pass-1";
const DOMAIN = `@wl-${stamp}.example.com`;
const emails = {
  single: `single-${stamp}${DOMAIN}`,
  other: `other-${stamp}${DOMAIN}`,
  admin: `boss-${stamp}${DOMAIN}`,
};

/** La white list è accesa sul server? Un'email fuori lista viene rifiutata solo in quel caso. */
async function serverAllowlistOn() {
  const res = await new Client().post("/sign-up/email", { name: "Probe", email: `probe-${stamp}@wl-off.example.org`, password: PASSWORD });
  await prisma.user.deleteMany({ where: { email: `probe-${stamp}@wl-off.example.org` } });
  return res.status === 403;
}

after(async () => {
  await prisma.allowedEmail.deleteMany({ where: { OR: [{ pattern: DOMAIN }, { pattern: emails.single }] } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  await prisma.$disconnect();
});

describe("O.9/O.10 rimozione di una voce @dominio", async () => {
  const on = await serverAllowlistOn();
  const skip = on ? false : "server senza AUTH_ALLOWLIST=on";

  test("preparazione: dominio ammesso, tre utenti verificati", { skip }, async () => {
    await prisma.allowedEmail.create({ data: { pattern: DOMAIN, note: "test" } });
    for (const email of Object.values(emails)) {
      const res = await new Client().post("/sign-up/email", { name: "WL", email, password: PASSWORD });
      assert.equal(res.status, 200, JSON.stringify(await body(res)));
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    }
    await prisma.user.update({ where: { email: emails.admin }, data: { role: "ADMIN" } });
    await prisma.allowedEmail.create({ data: { pattern: emails.single, note: "voce singola" } });
    for (const email of Object.values(emails)) {
      const res = await new Client().post("/sign-in/email", { email, password: PASSWORD });
      assert.equal(res.status, 200, `${email}: ${JSON.stringify(await body(res))}`);
    }
  });

  test("dopo la rimozione del dominio: O.9 la voce singola entra, gli altri no", { skip }, async () => {
    await prisma.allowedEmail.delete({ where: { pattern: DOMAIN } });
    const single = await new Client().post("/sign-in/email", { email: emails.single, password: PASSWORD });
    assert.equal(single.status, 200, JSON.stringify(await body(single)));
    const other = await new Client().post("/sign-in/email", { email: emails.other, password: PASSWORD });
    assert.equal(other.status, 403);
    assert.equal((await body(other)).code, "EMAIL_NOT_ALLOWED");
  });

  test("O.10 l'ADMIN del dominio rimosso resta ammesso", { skip }, async () => {
    const res = await new Client().post("/sign-in/email", { email: emails.admin, password: PASSWORD });
    assert.equal(res.status, 200, JSON.stringify(await body(res)));
  });
});
