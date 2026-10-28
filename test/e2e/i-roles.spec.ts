/** Sezione I del piano manuale: ruoli, pannello admin ed eliminazione utenti. */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { countUsers, deleteUsers, prepareUser } from "./db";
import { ADMIN, login } from "./helpers";
import { createUser, PASSWORD } from "./users";

const stamp = Date.now();
const EMAIL = `i-${stamp}@example.com`;
const row = (page: import("@playwright/test").Page, email: string) => page.locator("tr", { hasText: email });

/** Cambia il ruolo dalla UI e attende la fine della server action (POST a /admin). */
async function setRole(page: import("@playwright/test").Page, select: import("@playwright/test").Locator, role: string) {
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/admin/users"),
    select.selectOption(role),
  ]);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request, baseURL }) => {
  await createUser(request, baseURL!, EMAIL, "NUOVO", "I");
});

test.afterAll(() => {
  deleteUsers([EMAIL]);
});

test("I.1 utente NUOVO: dashboard con stato in attesa, API admin 403", async ({ page, request }) => {
  await login(page, EMAIL, PASSWORD);
  await expect(page.getByText(texts.pending.title)).toBeVisible();
  const admin = await request.get("/api/demo/admin", { headers: { cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") } });
  expect(admin.status()).toBe(403);
});

test("I.2 e I.3 cambio ruolo dalla UI: USER poi ADMIN, accesso aggiornato al reload", async ({ page, context }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await expect(page.getByRole("heading", { name: "Utenti" })).toBeVisible();
  const select = row(page, EMAIL).locator("select");
  await setRole(page, select, "USER");
  await expect(page.locator("[role=\"alert\"]:not(#__next-route-announcer__)")).toHaveCount(0);

  const user = await context.browser()!.newContext({ baseURL: test.info().project.use.baseURL });
  const userPage = await user.newPage();
  await login(userPage, EMAIL, PASSWORD);
  await userPage.goto("/admin");
  await expect(userPage.getByText(texts.denied.title)).toBeVisible();

  await setRole(page, select, "ADMIN");
  await userPage.reload();
  await expect(userPage.getByRole("button", { name: "Admin", exact: true })).toBeVisible();
  await expect(userPage.getByRole("heading", { name: "Utenti" })).toBeVisible();
  await setRole(page, select, "USER");
  await userPage.reload();
  await expect(userPage.getByText(texts.denied.title)).toBeVisible();
  await user.close();
});

test("I.4 la riga dell'admin non ha il selettore del ruolo", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  const self = row(page, ADMIN.email).first();
  await expect(self.locator("select")).toHaveCount(0);
  await expect(self.getByText("(tu)")).toBeVisible();
});

test("I.7 eliminazione: annulla non cambia nulla, conferma rimuove utente e dati", async ({ page, context }) => {
  const victim = `i-del-${stamp}@example.com`;
  const req = await context.request.post("/api/auth/sign-up/email", {
    data: { name: "Da eliminare", email: victim, password: PASSWORD },
    headers: { Origin: test.info().project.use.baseURL! },
  });
  expect(req.ok()).toBeTruthy();
  prepareUser(victim, "USER");

  // Sessione aperta dell'utente da eliminare, in un altro contesto
  const other = await context.browser()!.newContext({ baseURL: test.info().project.use.baseURL });
  const otherPage = await other.newPage();
  await login(otherPage, victim, PASSWORD);

  await login(page, ADMIN.email, ADMIN.password, "/admin");
  page.once("dialog", (d) => d.dismiss());
  await row(page, victim).getByRole("button", { name: /^Elimina/ }).click();
  await expect(row(page, victim)).toHaveCount(1);
  expect(countUsers(victim)).toBe(1);

  page.once("dialog", (d) => {
    expect(d.message()).toContain(victim);
    expect(d.message()).toContain("non è reversibile");
    d.accept();
  });
  await row(page, victim).getByRole("button", { name: /^Elimina/ }).click();
  await expect(row(page, victim)).toHaveCount(0);
  expect(countUsers(victim)).toBe(0);

  await otherPage.goto("/dashboard");
  await expect(otherPage).toHaveURL(/\/auth\/login/);
  await other.close();
});

test("I.8 (parziale) nessun pulsante elimina sulla propria riga", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await expect(row(page, ADMIN.email).getByRole("button", { name: "Elimina" })).toHaveCount(0);
  // Il seed admin è in AUTH_ADMIN_EMAILS: rimosso solo se la variabile lo include
  const seedRow = row(page, ADMIN.email).first();
  await expect(seedRow).toBeVisible();
});

test("I.9 telefono 375px: schede senza scroll orizzontale", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await expect(page.locator("ul li", { hasText: EMAIL }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
