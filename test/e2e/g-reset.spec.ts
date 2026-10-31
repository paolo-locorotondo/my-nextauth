/** Sezione G del piano manuale: reset password. */
import { expect, test, type Page } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { deleteUsers, verifyUser } from "./db";
import { fieldError, formError, login } from "./helpers";
import { now, waitForLink } from "./mail";

const stamp = Date.now();
const EMAIL = `g-${stamp}@example.com`;
const OLD = "Vecchia-pass-1";
const NEW = "Nuova-pass-2";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser, baseURL }) => {
  // Utente di prova: registrato dalla UI e poi verificato direttamente a DB
  const page = await browser.newPage({ baseURL });
  await page.goto("/auth/register");
  await page.locator("#name").fill("G");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(OLD);
  await page.locator("#confirm").fill(OLD);
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
  await expect(page).toHaveURL(/verify-email/);
  await page.close();
  verifyUser(EMAIL);
});

test.afterAll(() => {
  deleteUsers([EMAIL]);
});

async function requestReset(page: Page, email: string) {
  await page.goto("/auth/forgot-password");
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: texts.forgotPassword.submit, exact: true }).click();
}

async function setNewPassword(page: Page, pwd: string) {
  await page.locator("#password").fill(pwd);
  await page.locator("#confirm").fill(pwd);
  await page.getByRole("button", { name: texts.resetPassword.submit, exact: true }).click();
}

test("G.1 email registrata: messaggio neutro ed email di reset", async ({ page }) => {
  const at = now();
  await requestReset(page, EMAIL);
  await expect(page.getByText(texts.forgotPassword.sent)).toBeVisible();
  await waitForLink(EMAIL, texts.email.reset.subject, at);
});

test("G.2 email non registrata: stesso messaggio", async ({ page }) => {
  await requestReset(page, `nessuno-${stamp}@example.com`);
  await expect(page.getByText(texts.forgotPassword.sent)).toBeVisible();
});

test("G.3 password debole rifiutata, valida → login con avviso", async ({ page }) => {
  const at = now();
  await requestReset(page, EMAIL);
  await page.goto(await waitForLink(EMAIL, texts.email.reset.subject, at));
  await setNewPassword(page, "debole");
  await expect(fieldError(page, "password")).toBeVisible();
  await setNewPassword(page, NEW);
  await expect(page).toHaveURL(/\/auth\/login\?notice=password-updated/);
  await expect(page.getByText(texts.login.passwordUpdated)).toBeVisible();
});

test("G.4 la vecchia password non funziona, la nuova sì", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(OLD);
  await page.getByRole("button", { name: texts.login.submit, exact: true }).click();
  await expect(formError(page)).toHaveText(texts.errors.INVALID_EMAIL_OR_PASSWORD);

  await login(page, EMAIL, NEW);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("G.5 il reset revoca le sessioni aperte altrove", async ({ page, browser, baseURL }) => {
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await login(otherPage, EMAIL, NEW);

  const at = now();
  await requestReset(page, EMAIL);
  await page.goto(await waitForLink(EMAIL, texts.email.reset.subject, at));
  await setNewPassword(page, "Terza-pass-3");
  await expect(page).toHaveURL(/\/auth\/login/);

  await otherPage.goto("/dashboard");
  await expect(otherPage).toHaveURL(/\/auth\/login/);
  await other.close();
});

test("G.6 riuso dello stesso link → link non valido", async ({ page }) => {
  const at = now();
  await requestReset(page, EMAIL);
  const link = await waitForLink(EMAIL, texts.email.reset.subject, at);
  await page.goto(link);
  await setNewPassword(page, "Quarta-pass-4");
  await expect(page).toHaveURL(/\/auth\/login/);

  await page.goto(link);
  await expect(page.getByText(texts.resetPassword.invalidToken)).toBeVisible();
});

test("G.7 /auth/reset-password senza token: pagina senza errori, link per richiederne uno", async ({ page }) => {
  const res = await page.goto("/auth/reset-password");
  expect(res?.status()).toBeLessThan(500);
  await expect(page.getByRole("link", { name: texts.resetPassword.requestNew })).toBeVisible();
});
