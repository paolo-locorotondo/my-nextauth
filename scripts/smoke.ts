/**
 * Smoke test end-to-end via HTTP contro un'app in esecuzione.
 *
 *   AUTH_RATE_LIMIT=on npm run dev     (in un altro terminale; EMAIL_PROVIDER=console)
 *   npm run smoke                      (SMOKE_BASE_URL per un altro indirizzo)
 *
 * Richiede il DB con il seed (npm run db:seed): usa l'ADMIN di seed e crea
 * un utente usa-e-getta, cancellato a fine run. Legge i link dalle email
 * in .dev-mailbox.jsonl (adapter "console").
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";

const BASE = (process.env.SMOKE_BASE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
const API = `${BASE}/api/auth`;
const MAILBOX = path.join(process.cwd(), ".dev-mailbox.jsonl");
const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || "admin@example.com", password: process.env.SEED_ADMIN_PASSWORD || "Admin123!" };

const prisma = new PrismaClient();
const startedAt = new Date();
const stamp = Date.now();
const USER = { name: "Smoke Test", email: `smoke-${stamp}@example.com` };
/** Con la white list accesa lo smoke base registra USER: il suo dominio va ammesso. */
const USER_DOMAIN = `@example.com`;
const PASSWORDS = ["Smoke-pass-1", "Smoke-pass-2", "Smoke-pass-3"];

// ── HTTP con cookie jar ────────────────────────────────────────────────

class Client {
  cookies = new Map<string, string>();
  /** IP fisso per il client (rate limit per IP); di default uno casuale per richiesta. */
  constructor(private ip?: string) {}

  private store(res: Response) {
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a)) || value === "";
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async request(url: string, init: RequestInit & { json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    headers.set("Origin", BASE);
    headers.set("x-forwarded-for", this.ip ?? `10.${rand()}.${rand()}.${rand()}`);
    if (this.cookies.size) headers.set("Cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (init.json !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(init.json);
      init.method ??= "POST";
    }
    const res = await fetch(url.startsWith("http") ? url : BASE + url, { ...init, headers, redirect: "manual" });
    this.store(res);
    return res;
  }

  post(endpoint: string, json: unknown) {
    return this.request(API + endpoint, { json });
  }
}

const rand = () => Math.floor(Math.random() * 254) + 1;
const location = (res: Response) => {
  const loc = res.headers.get("location");
  return loc ? new URL(loc, BASE).pathname + new URL(loc, BASE).search : null;
};
const body = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Attende l'email (inviata in background con after()) e ne estrae il link. */
async function waitForLink(to: string, subjectIncludes: string, after: Date): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const content = await readFile(MAILBOX, "utf8").catch(() => "");
    const mails = content
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { to: string; subject: string; text: string; sentAt: string })
      .filter((m) => m.to === to && m.subject.includes(subjectIncludes) && new Date(m.sentAt) >= after);
    const last = mails.at(-1);
    const link = last?.text.match(/https?:\/\/\S+/)?.[0];
    if (link) return link;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Nessuna email "${subjectIncludes}" per ${to} in ${MAILBOX} (EMAIL_PROVIDER=console?)`);
}

// ── Runner ─────────────────────────────────────────────────────────────

let passed = 0;
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

async function main() {
  console.log(`Smoke test contro ${BASE}\n`);
  // No-op se la white list è spenta; con AUTH_ALLOWLIST=on ammette il dominio di test
  await prisma.allowedEmail.upsert({
    where: { pattern: USER_DOMAIN },
    update: {},
    create: { pattern: USER_DOMAIN, note: "smoke-base" },
  });
  const anon = new Client();
  const admin = new Client();
  const user = new Client();

  await step("/ è pubblica (200 senza cookie)", async () => {
    const res = await anon.request("/");
    assert.equal(res.status, 200);
  });

  await step("rotta protetta senza cookie → 307 al login con callbackUrl e no-store", async () => {
    const res = await anon.request("/dashboard?tab=1");
    assert.equal(res.status, 307);
    assert.equal(location(res), "/auth/login?callbackUrl=%2Fdashboard%3Ftab%3D1");
    assert.match(res.headers.get("cache-control") ?? "", /no-store/);
  });

  await step("API protetta senza cookie → 401", async () => {
    assert.equal((await anon.request("/api/demo/me")).status, 401);
  });

  await step("login ADMIN senza callbackUrl → landingForRole (/admin)", async () => {
    const res = await admin.post("/sign-in/email", ADMIN);
    assert.equal(res.status, 200, JSON.stringify(await body(res)));
    const cont = await admin.request("/auth/continue");
    assert.equal(cont.status, 307);
    assert.equal(location(cont), "/admin");
  });

  await step("/auth/continue: callbackUrl valido rispettato, esterno ignorato", async () => {
    assert.equal(location(await admin.request("/auth/continue?callbackUrl=%2Fdashboard%3Fx%3D1")), "/dashboard?x=1");
    assert.equal(location(await admin.request("/auth/continue?callbackUrl=https%3A%2F%2Fevil.com")), "/admin");
    assert.equal(location(await admin.request("/auth/continue?callbackUrl=%2F%2Fevil.com")), "/admin");
  });

  await step("callbackURL esterno rifiutato da Better Auth (sign-in e reset)", async () => {
    const signIn = await anon.post("/sign-in/email", { ...ADMIN, callbackURL: "https://evil.com/steal" });
    assert.equal(signIn.status, 403, JSON.stringify(await body(signIn)));
    const reset = await anon.post("/request-password-reset", { email: ADMIN.email, redirectTo: "https://evil.com/reset" });
    assert.equal(reset.status, 403);
  });

  await step("registrazione con password debole → 400 PASSWORD_POLICY", async () => {
    const res = await user.post("/sign-up/email", { ...USER, password: "debole" });
    assert.equal(res.status, 400);
    assert.equal((await body(res)).code, "PASSWORD_POLICY");
  });

  const signUpAt = new Date();
  await step("registrazione valida → 200 e invio email di verifica", async () => {
    const res = await user.post("/sign-up/email", { ...USER, password: PASSWORDS[0], callbackURL: "/auth/continue" });
    assert.equal(res.status, 200, JSON.stringify(await body(res)));
    await waitForLink(USER.email, "Conferma", signUpAt);
  });

  await step("registrazione con email già esistente → stessa risposta, email 'hai già un account'", async () => {
    const at = new Date();
    const usersBefore = await prisma.user.count({ where: { email: ADMIN.email } });
    const res = await anon.post("/sign-up/email", { name: "Altro", email: ADMIN.email, password: PASSWORDS[0] });
    assert.equal(res.status, 200, "niente user enumeration: risposta identica a una registrazione nuova");
    const link = await waitForLink(ADMIN.email, "Hai già un account", at);
    assert.match(link, /\/auth\/login$/);
    assert.equal(await prisma.user.count({ where: { email: ADMIN.email } }), usersBefore);
  });

  await step("login prima della verifica → 403 EMAIL_NOT_VERIFIED", async () => {
    // Come la UI: callbackURL serve anche al link di verifica reinviato (sendOnSignIn)
    const res = await user.post("/sign-in/email", { email: USER.email, password: PASSWORDS[0], callbackURL: "/auth/continue" });
    assert.equal(res.status, 403);
    assert.equal((await body(res)).code, "EMAIL_NOT_VERIFIED");
  });

  await step("link di verifica → auto sign-in, sessione con ruolo NUOVO", async () => {
    const link = await waitForLink(USER.email, "Conferma", signUpAt);
    const res = await user.request(link);
    assert.equal(res.status, 302);
    assert.equal(location(res), "/auth/continue");
    const cont = await user.request("/auth/continue");
    assert.equal(location(cont), "/dashboard");
    const me = await body(await user.request("/api/demo/me"));
    assert.equal(me.user.email, USER.email);
    assert.equal(me.user.role, "NUOVO");
    assert.equal(me.user.emailVerified, true);
  });

  await step("link di verifica non valido → verify-email?error", async () => {
    const res = await anon.request(`${API}/verify-email?token=nope&callbackURL=${encodeURIComponent("/auth/continue")}`);
    assert.equal(location(res), "/auth/continue?error=INVALID_TOKEN");
    assert.equal(location(await anon.request("/auth/continue?error=INVALID_TOKEN")), "/auth/verify-email?error=INVALID_TOKEN");
  });

  await step("/api/demo/admin: 403, poi 200 dopo la promozione (senza cache stale)", async () => {
    assert.equal((await user.request("/api/demo/admin")).status, 403);
    await prisma.user.update({ where: { email: USER.email }, data: { role: "ADMIN" } });
    assert.equal((await user.request("/api/demo/admin")).status, 200);
    await prisma.user.update({ where: { email: USER.email }, data: { role: "USER" } });
    assert.equal((await user.request("/api/demo/admin")).status, 403);
  });

  await step("reset password: revoca le vecchie sessioni, la nuova password funziona", async () => {
    const at = new Date();
    const req = await anon.post("/request-password-reset", { email: USER.email, redirectTo: "/auth/reset-password" });
    assert.equal(req.status, 200);
    const link = await waitForLink(USER.email, "Reimposta", at);

    const redirect = await anon.request(link);
    const target = location(redirect) ?? "";
    assert.match(target, /^\/auth\/reset-password\?token=/);
    const token = new URL(target, BASE).searchParams.get("token");

    const weak = await anon.post("/reset-password", { newPassword: "debole", token });
    assert.equal(weak.status, 400);
    const res = await anon.post("/reset-password", { newPassword: PASSWORDS[1], token });
    assert.equal(res.status, 200, JSON.stringify(await body(res)));

    assert.equal((await user.request("/api/demo/me")).status, 401, "la vecchia sessione doveva essere revocata");
    assert.equal((await user.post("/sign-in/email", { email: USER.email, password: PASSWORDS[0] })).status, 401);
    assert.equal((await user.post("/sign-in/email", { email: USER.email, password: PASSWORDS[1] })).status, 200);
  });

  await step("cambio password", async () => {
    const wrong = await user.post("/change-password", { currentPassword: "Sbagliata-1", newPassword: PASSWORDS[2] });
    assert.equal(wrong.status, 400);
    const res = await user.post("/change-password", { currentPassword: PASSWORDS[1], newPassword: PASSWORDS[2], revokeOtherSessions: true });
    assert.equal(res.status, 200, JSON.stringify(await body(res)));
    assert.equal((await user.request("/api/demo/me")).status, 200, "la sessione corrente resta valida");
    assert.equal((await anon.post("/sign-in/email", { email: USER.email, password: PASSWORDS[2] })).status, 200);
  });

  await step("rate limit: la 6ª sign-in nello stesso minuto → 429", async () => {
    const attacker = new Client(`172.16.${rand()}.${rand()}`);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await attacker.post("/sign-in/email", { email: USER.email, password: "Sbagliata-1" })).status);
    }
    assert.deepEqual(statuses.slice(0, 5), [401, 401, 401, 401, 401]);
    assert.equal(statuses[5], 429, "avvia il server con AUTH_RATE_LIMIT=on");
  });

  await step("logout → la rotta protetta torna a reindirizzare", async () => {
    const res = await user.post("/sign-out", {});
    assert.equal(res.status, 200);
    assert.equal((await user.request("/dashboard")).status, 307);
    assert.equal((await user.request("/api/demo/me")).status, 401);
  });

  // White list: gira solo se il server ha AUTH_ALLOWLIST=on (altrimenti gli step si saltano)
  if (process.env.SMOKE_ALLOWLIST === "on") await allowlistSteps();

  console.log(`\n${passed} step OK`);
}

/**
 * White list (AUTH_ALLOWLIST=on sul server, SMOKE_ALLOWLIST=on per questo script).
 * Usa un dominio e un'email di test dedicati, rimossi a fine run.
 */
async function allowlistSteps() {
  const domain = `@smoke-${stamp}.example.com`;
  const inDomain = `allowed-${stamp}@smoke-${stamp}.example.com`;
  const outside = `outsider-${stamp}@example.org`;
  const guest = new Client();
  const outsiderClient = new Client();

  try {
    await step("white list: registrazione fuori lista → 403 EMAIL_NOT_ALLOWED", async () => {
      const res = await outsiderClient.post("/sign-up/email", { name: "Fuori", email: outside, password: PASSWORDS[0] });
      const json = await body(res);
      assert.equal(res.status, 403, JSON.stringify(json));
      assert.equal(json.code, "EMAIL_NOT_ALLOWED");
      assert.equal(await prisma.user.count({ where: { email: outside } }), 0, "nessun utente creato");
    });

    await step("white list: aggiunta dominio via DB → registrazione ammessa", async () => {
      await prisma.allowedEmail.create({ data: { pattern: domain, note: "smoke" } });
      const res = await guest.post("/sign-up/email", { name: "Dentro", email: inDomain, password: PASSWORDS[0] });
      assert.equal(res.status, 200, JSON.stringify(await body(res)));
    });

    await step("white list: login di utente rimosso dalla lista → 403, sessione aperta revocata", async () => {
      // utente già verificato e con sessione aperta
      await prisma.user.update({ where: { email: inDomain }, data: { emailVerified: true } });
      const session = new Client();
      const login = await session.post("/sign-in/email", { email: inDomain, password: PASSWORDS[0] });
      assert.equal(login.status, 200, JSON.stringify(await body(login)));
      assert.equal((await session.request("/api/demo/me")).status, 200);

      // rimozione della voce tramite la stessa logica della server action
      await prisma.allowedEmail.delete({ where: { pattern: domain } });
      await prisma.session.deleteMany({ where: { user: { email: inDomain } } });

      const again = await new Client().post("/sign-in/email", { email: inDomain, password: PASSWORDS[0] });
      const againJson = await body(again);
      assert.equal(again.status, 403);
      assert.equal(againJson.code, "EMAIL_NOT_ALLOWED");
      assert.equal((await session.request("/api/demo/me")).status, 401, "sessione revocata");
    });

    await step("white list: admin di bootstrap ammesso anche con lista vuota", async () => {
      const res = await new Client().post("/sign-in/email", ADMIN);
      assert.equal(res.status, 200, JSON.stringify(await body(res)));
    });
  } finally {
    await prisma.allowedEmail.deleteMany({ where: { pattern: domain } });
    await prisma.user.deleteMany({ where: { email: { in: [inDomain, outside] } } });
  }
}

main()
  .catch((err) => {
    console.error("\n", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.user.deleteMany({ where: { email: USER.email } });
    await prisma.allowedEmail.deleteMany({ where: { pattern: USER_DOMAIN, note: "smoke-base" } });
    await prisma.verification.deleteMany({ where: { createdAt: { gte: startedAt }, identifier: { contains: USER.email } } });
    await prisma.$disconnect();
  });
