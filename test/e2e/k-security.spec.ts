/** Sezione K del piano manuale (parte senza rate limit): header, cookie, CSRF, server action. */
import { expect, test } from "@playwright/test";
import { deleteUsers, getRole } from "./db";
import { ADMIN, login } from "./helpers";
import { createUser, PASSWORD } from "./users";

const stamp = Date.now();
const ATTACKER = `k-att-${stamp}@example.com`;
const VICTIM = `k-vic-${stamp}@example.com`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request, baseURL }) => {
  await createUser(request, baseURL!, ATTACKER, "USER", "K");
  await createUser(request, baseURL!, VICTIM, "NUOVO", "K");
});

test.afterAll(() => {
  deleteUsers([ATTACKER, VICTIM]);
});

test("K.3 header di sicurezza nelle pagine servite al browser", async ({ page }) => {
  const res = await page.goto("/");
  const h = res!.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
});

test("K.2 (parte locale) cookie di sessione HttpOnly e SameSite=Lax", async ({ page, context }) => {
  await login(page, ATTACKER, PASSWORD);
  const session = (await context.cookies()).find((c) => c.name.endsWith("session_token"));
  expect(session).toBeTruthy();
  expect(session!.httpOnly).toBe(true);
  expect(session!.sameSite).toBe("Lax");
});

test("K.4 login con Origin estraneo → 403", async ({ request }) => {
  const res = await request.post("/api/auth/sign-in/email", {
    data: ADMIN,
    headers: { Origin: "https://evil.com" },
  });
  expect(res.status()).toBe(403);
});

test("K.5 server action di cambio ruolo rigiocata da un utente senza permessi: nessun effetto", async ({ page, browser, baseURL }) => {
  // L'admin cambia il ruolo dalla UI: catturo la richiesta della server action
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  const row = page.locator("tr", { hasText: VICTIM });
  const [captured] = await Promise.all([
    page.waitForRequest((r) => r.method() === "POST" && new URL(r.url()).pathname === "/admin"),
    row.locator("select").selectOption("USER"),
  ]);
  await expect.poll(() => getRole(VICTIM)).toBe("USER");

  // La stessa richiesta, con i cookie di un USER e il ruolo ADMIN nel corpo
  const ctx = await browser.newContext({ baseURL });
  const userPage = await ctx.newPage();
  await login(userPage, ATTACKER, PASSWORD);
  const headers = { ...captured.headers() };
  for (const k of ["cookie", "host", "content-length", "origin", "referer"]) delete headers[k];
  const body = (captured.postData() ?? "").replace('"USER"', '"ADMIN"');
  expect(body).toContain("ADMIN");
  const replay = await ctx.request.post("/admin", { headers: { ...headers, Origin: baseURL! }, data: body });
  expect(replay.status()).toBeLessThan(500);

  expect(getRole(VICTIM)).toBe("USER");
  await ctx.close();
});
