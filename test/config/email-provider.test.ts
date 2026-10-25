/**
 * Provider email (copre M.3 e L.5) con `fetch` simulato: nessuna email vera, nessun server.
 * sendAuthEmail non deve mai lanciare: l'errore finisce nel log e la risposta HTTP non cambia.
 *
 *   npm run test:config
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runTs } from "../helpers/child";
import { resendSender } from "../../lib/auth/email/resend";
import { sendgridSender } from "../../lib/auth/email/sendgrid";

const PROD = { NODE_ENV: "production", BETTER_AUTH_URL: "https://example.com", BETTER_AUTH_SECRET: "x".repeat(32) };
const SEND = `
const mod = await import("./lib/auth/email/index.ts");
const { sendAuthEmail } = mod.sendAuthEmail ? mod : mod.default;
await sendAuthEmail("verify", { email: "a@example.com", name: "A" }, "https://example.com/x");
console.log("DONE");`;
const MSG = { to: "a@example.com", subject: "Oggetto", html: "<p>ciao</p>", text: "ciao" };

test("M.3 produzione senza EMAIL_PROVIDER → log esplicito, nessuna eccezione", () => {
  const r = runTs(SEND, PROD);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DONE/);
  assert.match(r.stderr, /invio email "verify" a a@example\.com fallito/);
  assert.match(r.stderr, /EMAIL_PROVIDER non configurato/);
});

test("EMAIL_PROVIDER=resend senza RESEND_API_KEY → log esplicito", () => {
  const r = runTs(SEND, { ...PROD, EMAIL_PROVIDER: "resend" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /RESEND_API_KEY è vuota/);
});

test("EMAIL_PROVIDER=sendgrid senza SENDGRID_API_KEY → log esplicito", () => {
  const r = runTs(SEND, { ...PROD, EMAIL_PROVIDER: "sendgrid" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /SENDGRID_API_KEY è vuota/);
});

test("L.5 API key errata (401 dal provider) → sendAuthEmail non lancia e logga il fallimento", () => {
  // fetch sostituito nel processo figlio: nessuna chiamata di rete
  const code = `
globalThis.fetch = async () => new Response('{"message":"API key is invalid"}', { status: 401 });
${SEND}`;
  const r = runTs(code, { ...PROD, EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_finta" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /DONE/);
  assert.match(r.stderr, /Resend 401/);
});

test("resend: richiesta ben formata, e lancia sul 4xx", async () => {
  const realFetch = globalThis.fetch;
  let seen: { url: string; init: RequestInit } | undefined;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    await resendSender("re_key", "App <no@x.it>").send(MSG);
    assert.equal(seen?.url, "https://api.resend.com/emails");
    assert.equal((seen?.init.headers as Record<string, string>).Authorization, "Bearer re_key");
    assert.deepEqual(JSON.parse(String(seen?.init.body)).to, ["a@example.com"]);
    globalThis.fetch = (async () => new Response("no", { status: 422 })) as typeof fetch;
    await assert.rejects(resendSender("re_key", "no@x.it").send(MSG), /Resend 422/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("sendgrid: richiesta ben formata (mittente 'Nome <email>'), e lancia sul 4xx", async () => {
  const realFetch = globalThis.fetch;
  let body: { from: unknown; personalizations: unknown } | undefined;
  globalThis.fetch = (async (_u: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return new Response(null, { status: 202 });
  }) as typeof fetch;
  try {
    await sendgridSender("SG.key", "My App <no@x.it>").send(MSG);
    assert.deepEqual(body?.from, { email: "no@x.it", name: "My App" });
    assert.deepEqual(body?.personalizations, [{ to: [{ email: "a@example.com" }] }]);
    globalThis.fetch = (async () => new Response("no", { status: 403 })) as typeof fetch;
    await assert.rejects(sendgridSender("SG.key", "no@x.it").send(MSG), /SendGrid 403/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
