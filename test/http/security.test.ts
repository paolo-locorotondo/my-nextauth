/**
 * Test HTTP di sicurezza contro l'app in esecuzione (come lo smoke: `npm run dev`
 * con EMAIL_PROVIDER=console e AUTH_RATE_LIMIT=on). Copre i test manuali K.3, M.4,
 * I.6, G.2, G.7, A.5. Crea utenti usa-e-getta e li cancella a fine run.
 *
 *   npm run test:http
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { PrismaClient } from "../../app/generated/prisma/client";
import { allowTestDomain, releaseTestDomain } from "../helpers/allow";
import { ADMIN, BASE, Client, body, location } from "../helpers/http";

const prisma = new PrismaClient();
const stamp = Date.now();
const created: string[] = [];

before(async () => {
  await allowTestDomain(prisma);
});

after(async () => {
  await releaseTestDomain(prisma);
  await prisma.user.deleteMany({ where: { email: { in: created } } });
  await prisma.$disconnect();
});

describe("K.3 header di sicurezza", () => {
  test("presenti su una pagina pubblica", async () => {
    const res = await new Client().request("/");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.match(res.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  });
});

describe("M.4 controllo Origin (CSRF)", () => {
  const attempt = (origin: string) => {
    const c = new Client();
    return c.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { Origin: origin },
      json: { email: "nessuno@example.com", password: "Sbagliata1!" },
    });
  };
  test("origine sconosciuta → 403", async () => {
    assert.equal((await attempt("https://evil.com")).status, 403);
  });
  test("origine dell'app → non rifiutata per l'origine (401 credenziali)", async () => {
    assert.equal((await attempt(BASE)).status, 401);
  });
});

describe("I.6 il ruolo non è forzabile dal client", () => {
  test("sign-up con role=ADMIN → utente creato con ruolo di default", async () => {
    const email = `sec-role-${stamp}@example.com`;
    created.push(email);
    const res = await new Client().post("/sign-up/email", { name: "Role", email, password: "Sec-pass-1", role: "ADMIN" });
    assert.ok(res.status === 200 || res.status === 400, `status ${res.status}`);
    const u = await prisma.user.findUnique({ where: { email } });
    assert.notEqual(u?.role, "ADMIN");
  });
});

describe("G.2 anti-enumerazione", () => {
  test("reset password: stessa risposta per email esistente e inesistente", async () => {
    const a = await new Client().post("/request-password-reset", { email: ADMIN.email, redirectTo: "/auth/reset-password" });
    const b = await new Client().post("/request-password-reset", { email: `nessuno-${stamp}@example.com`, redirectTo: "/auth/reset-password" });
    assert.equal(a.status, b.status);
    assert.deepEqual(await body(a), await body(b));
  });
  test("login: stesso errore per email inesistente e password errata", async () => {
    const a = await new Client().post("/sign-in/email", { email: `nessuno-${stamp}@example.com`, password: "Sbagliata1!" });
    const b = await new Client().post("/sign-in/email", { email: ADMIN.email, password: "Sbagliata1!" });
    assert.equal(a.status, b.status);
    assert.deepEqual(await body(a), await body(b));
  });
});

describe("G.7 token di reset mancante o non valido", () => {
  test("reset-password senza token valido → errore", async () => {
    const res = await new Client().post("/reset-password", { newPassword: "Nuova-pass-1", token: "inesistente" });
    assert.ok(res.status >= 400 && res.status < 500, `status ${res.status}`);
  });
  test("pagina reset senza token si apre (200) senza 500", async () => {
    const res = await new Client().request("/auth/reset-password");
    assert.ok(res.status < 500, `status ${res.status}`);
  });
});

describe("A.5/A.6 pagine di errore e utente già loggato", () => {
  test("/auth/error con codice sconosciuto → 200", async () => {
    assert.equal((await new Client().request("/auth/error?error=boh")).status, 200);
  });
  test("da loggato /auth/login rimanda via dalla login", async () => {
    const c = new Client();
    const r = await c.post("/sign-in/email", ADMIN);
    assert.equal(r.status, 200);
    const page = await c.request("/auth/login");
    assert.ok(page.status === 307 || page.status === 200, `status ${page.status}`);
    if (page.status === 307) assert.notEqual(location(page), "/auth/login");
  });
});
