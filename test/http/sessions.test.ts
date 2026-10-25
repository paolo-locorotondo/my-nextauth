/**
 * Validità delle sessioni lette dal DB a ogni richiesta (copre J.3 e la revoca/declassamento
 * su cui poggia I.3). Richiede server + DB come lo smoke (`EMAIL_PROVIDER=console`).
 *
 *   npm run test:http
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { PrismaClient } from "../../app/generated/prisma/client";
import { allowTestDomain, releaseTestDomain } from "../helpers/allow";
import { Client, body } from "../helpers/http";

const prisma = new PrismaClient();
const stamp = Date.now();
const PASSWORD = "Sess-pass-1";
const created: string[] = [];

before(async () => {
  await allowTestDomain(prisma);
});

after(async () => {
  await releaseTestDomain(prisma);
  await prisma.user.deleteMany({ where: { email: { in: created } } });
  await prisma.$disconnect();
});

/** Registra un utente, lo marca verificato via DB e restituisce un client già loggato. */
async function loggedInUser(tag: string) {
  const email = `sess-${tag}-${stamp}@example.com`;
  created.push(email);
  const c = new Client();
  const up = await c.post("/sign-up/email", { name: "Sess", email, password: PASSWORD });
  assert.equal(up.status, 200, JSON.stringify(await body(up)));
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  const login = await c.post("/sign-in/email", { email, password: PASSWORD });
  assert.equal(login.status, 200, JSON.stringify(await body(login)));
  return { c, email };
}

describe("sessioni lette dal DB a ogni richiesta", () => {
  test("J.3 utente eliminato dal DB con sessione aperta → anonimo al reload", async () => {
    const { c, email } = await loggedInUser("del");
    assert.equal((await c.request("/api/demo/me")).status, 200);
    await prisma.user.delete({ where: { email } });
    assert.equal((await c.request("/api/demo/me")).status, 401);
  });

  test("sessione revocata dal DB → 401 subito", async () => {
    const { c, email } = await loggedInUser("rev");
    assert.equal((await c.request("/api/demo/me")).status, 200);
    await prisma.session.deleteMany({ where: { user: { email } } });
    assert.equal((await c.request("/api/demo/me")).status, 401);
  });

  test("I.3 promozione e declassamento hanno effetto immediato su /api/demo/admin", async () => {
    const { c, email } = await loggedInUser("role");
    assert.equal((await c.request("/api/demo/admin")).status, 403);
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    assert.equal((await c.request("/api/demo/admin")).status, 200);
    await prisma.user.update({ where: { email }, data: { role: "USER" } });
    assert.equal((await c.request("/api/demo/admin")).status, 403);
  });
});
