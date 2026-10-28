/** Sezione O del piano manuale: white list (profilo "allowlist": AUTH_ALLOWLIST=on, AUTH_ADMIN_EMAILS noto). */
import { expect, test, type Browser, type Page } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { E2E_BOOTSTRAP_ADMIN, E2E_NOTE } from "./constants";
import { addAllowed, countUsers, deleteAllowedByNote, deleteUsers } from "./db";
import { ADMIN, formError, login } from "./helpers";
import { createUser, PASSWORD } from "./users";

const stamp = Date.now();
const DOMAIN = `@wl-${stamp}.example.com`;
const DOMAIN2 = `@wl2-${stamp}.example.com`;
const inDomain = (tag: string, d = DOMAIN) => `${tag}-${stamp}${d}`;
const created: string[] = [E2E_BOOTSTRAP_ADMIN];

const PATTERN_PLACEHOLDER = "mario@x.it oppure @azienda.it";
/** Riga della tabella la cui cella "Voce" è esattamente il pattern. */
const entryRow = (page: Page, pattern: string) =>
  page.getByRole("row").filter({ has: page.getByRole("cell", { name: pattern, exact: true }) });

async function register(page: Page, email: string) {
  await page.goto("/auth/register");
  await page.locator("#name").fill("O");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#confirm").fill(PASSWORD);
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
}

async function addEntry(page: Page, pattern: string, note = "") {
  await page.getByPlaceholder(PATTERN_PLACEHOLDER).fill(pattern);
  await page.getByPlaceholder("Nota (facoltativa)").fill(note);
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/allowed-emails")),
    page.getByRole("button", { name: "Aggiungi", exact: true }).click(),
  ]);
}

/** Contesto separato con l'utente già loggato. */
async function sessionFor(browser: Browser, baseURL: string, email: string) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await login(page, email, PASSWORD);
  return { context, page };
}

test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  deleteAllowedByNote(E2E_NOTE);
  deleteUsers(created);
});

test("O.1 email fuori lista: messaggio nel form, nessun utente creato", async ({ page }) => {
  const email = `o1-${stamp}@fuori-lista.example.net`;
  created.push(email);
  await register(page, email);
  await expect(formError(page)).toHaveText(texts.errors.EMAIL_NOT_ALLOWED);
  expect(countUsers(email)).toBe(0);
});

test("O.2 admin di bootstrap (AUTH_ADMIN_EMAILS) entra con la lista vuota", async ({ page, request, baseURL }) => {
  await createUser(request, baseURL!, E2E_BOOTSTRAP_ADMIN, "ADMIN", "Bootstrap");
  await login(page, E2E_BOOTSTRAP_ADMIN, PASSWORD);
  await expect(page).toHaveURL(/\/admin\/users$/);
});

test("O.3 admin di seed (ADMIN nel DB) entra", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/admin\/users$/);
});

test("O.4 e O.5 gestione voci: aggiunta, voci malformate e duplicato", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin/allowed-emails");
  await expect(page.getByText("non è attiva")).toHaveCount(0);

  await addEntry(page, DOMAIN, E2E_NOTE);
  await expect(entryRow(page, DOMAIN)).toBeVisible();
  const single = `mario-${stamp}@x.example.it`;
  await addEntry(page, single, E2E_NOTE);
  await expect(entryRow(page, single)).toContainText(E2E_NOTE);

  for (const bad of ["foo", "@", "a@b@c", "@dominio"]) {
    await addEntry(page, bad);
    await expect(formError(page)).toBeVisible();
    await expect(entryRow(page, bad)).toHaveCount(0);
  }

  await addEntry(page, DOMAIN, E2E_NOTE);
  await expect(formError(page)).toHaveText("Questa voce è già in lista");
});

test("O.6 registrazione dentro il dominio ammesso va avanti, fuori dominio no", async ({ page }) => {
  const ok = inDomain("o6");
  created.push(ok);
  await register(page, ok);
  await expect(page).toHaveURL(/\/auth\/verify-email\?email=/);

  const ko = `o6-${stamp}@altro.example.net`;
  created.push(ko);
  await register(page, ko);
  await expect(formError(page)).toHaveText(texts.errors.EMAIL_NOT_ALLOWED);
});

test("O.8 O.9 O.10 rimozione di un dominio: revoca sessioni, voce singola e ADMIN restano", async ({ page, browser, request, baseURL }) => {
  addAllowed(DOMAIN2, E2E_NOTE);
  const plain = inDomain("o8", DOMAIN2);
  const single = inDomain("o9", DOMAIN2);
  const admin = inDomain("o10", DOMAIN2);
  created.push(plain, single, admin);
  await createUser(request, baseURL!, plain, "USER", "O8");
  await createUser(request, baseURL!, single, "USER", "O9");
  await createUser(request, baseURL!, admin, "ADMIN", "O10");
  addAllowed(single, E2E_NOTE);

  const sPlain = await sessionFor(browser, baseURL!, plain);
  const sSingle = await sessionFor(browser, baseURL!, single);
  const sAdmin = await sessionFor(browser, baseURL!, admin);

  await login(page, ADMIN.email, ADMIN.password, "/admin/allowed-emails");
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/allowed-emails")),
    entryRow(page, DOMAIN2).getByRole("button", { name: /^Rimuovi/ }).click(),
  ]);
  await expect(entryRow(page, DOMAIN2)).toHaveCount(0);

  // O.8: utente semplice → sessione revocata e login rifiutato
  await sPlain.page.goto("/dashboard");
  await expect(sPlain.page).toHaveURL(/\/auth\/login/);
  await sPlain.page.locator("#email").fill(plain);
  await sPlain.page.locator("#password").fill(PASSWORD);
  await sPlain.page.getByRole("button", { name: texts.login.submit, exact: true }).click();
  await expect(formError(sPlain.page)).toHaveText(texts.errors.EMAIL_NOT_ALLOWED);

  // O.9: voce singola ancora in lista → sessione intatta
  await sSingle.page.goto("/dashboard");
  await expect(sSingle.page).toHaveURL(/\/dashboard$/);

  // O.10: ADMIN → sessione intatta
  await sAdmin.page.goto("/admin");
  await expect(sAdmin.page).toHaveURL(/\/admin\/users$/);

  await Promise.all([sPlain.context.close(), sSingle.context.close(), sAdmin.context.close()]);
});
