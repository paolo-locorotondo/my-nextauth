/** Sezione H del piano manuale: cambio password da utente loggato. */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { deleteUsers, verifyUser } from "./db";
import { formError, login } from "./helpers";

const stamp = Date.now();
const EMAIL = `h-${stamp}@example.com`;
const OLD = "Iniziale-pass-1";
const NEW = "Seconda-pass-2";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser, baseURL }) => {
  const page = await browser.newPage({ baseURL });
  await page.goto("/auth/register");
  await page.locator("#name").fill("H");
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

async function changePassword(page: import("@playwright/test").Page, current: string, next: string, confirm = next) {
  await page.goto("/user/change-password");
  await page.locator("#current").fill(current);
  await page.locator("#password").fill(next);
  await page.locator("#confirm").fill(confirm);
  await page.getByRole("button", { name: texts.changePassword.submit, exact: true }).click();
}

test("H.1 password attuale sbagliata: errore nel form", async ({ page }) => {
  await login(page, EMAIL, OLD);
  await changePassword(page, "Sbagliata-1", NEW);
  await expect(formError(page)).toContainText(texts.errors.INVALID_PASSWORD);
});

test("H.2 nuova password uguale alla vecchia o non confermata: rifiutata", async ({ page }) => {
  await login(page, EMAIL, OLD);
  await changePassword(page, OLD, OLD);
  await expect(formError(page)).toHaveText(texts.changePassword.samePassword);
  await changePassword(page, OLD, NEW, "Diversa-pass-9");
  await expect(formError(page)).toHaveText(texts.register.passwordMismatch);
});

test("H.3 cambio corretto: messaggio di successo, la nuova password funziona", async ({ page, browser, baseURL }) => {
  // Seconda sessione aperta prima del cambio: deve essere disconnessa
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await login(otherPage, EMAIL, OLD);

  await login(page, EMAIL, OLD);
  await changePassword(page, OLD, NEW);
  await expect(page.getByText(texts.changePassword.success)).toBeVisible();
  await expect(page.locator("#current")).toHaveValue("");

  // La sessione corrente resta valida
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);

  // L'altra sessione è stata revocata
  await otherPage.goto("/dashboard");
  await expect(otherPage).toHaveURL(/\/auth\/login/);
  await other.close();

  // Login con la nuova password (in un contesto pulito)
  const fresh = await browser.newContext({ baseURL });
  const freshPage = await fresh.newPage();
  await login(freshPage, EMAIL, NEW);
  await expect(freshPage).toHaveURL(/\/dashboard$/);
  await fresh.close();
});

test("H.4 pagina senza sessione: redirect al login con callbackUrl", async ({ browser, baseURL }) => {
  const anon = await browser.newContext({ baseURL });
  const page = await anon.newPage();
  await page.goto("/user/change-password");
  await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fuser%2Fchange-password/);
  await anon.close();
});
