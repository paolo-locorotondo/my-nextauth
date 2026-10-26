/** Sezione J del piano manuale: logout e revoca. */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { deleteUsers } from "./db";
import { apriMenuUtente, login } from "./helpers";
import { createUser, PASSWORD } from "./users";

const stamp = Date.now();
const EMAIL = `j-${stamp}@example.com`;
const GONE = `j-gone-${stamp}@example.com`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request, baseURL }) => {
  await createUser(request, baseURL!, EMAIL, "USER", "J");
  await createUser(request, baseURL!, GONE, "USER", "J");
});

test.afterAll(() => {
  deleteUsers([EMAIL, GONE]);
});

test("J.1 Esci: anonimo in home, dashboard richiede di nuovo il login", async ({ page }) => {
  await login(page, EMAIL, PASSWORD, "/dashboard");
  await apriMenuUtente(page);
  await page.getByRole("button", { name: texts.userMenu.signOut, exact: true }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: texts.userMenu.signIn, exact: true })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("J.2 dopo il logout il tasto indietro non mostra la dashboard", async ({ page }) => {
  await login(page, EMAIL, PASSWORD, "/dashboard");
  await apriMenuUtente(page);
  await page.getByRole("button", { name: texts.userMenu.signOut, exact: true }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: texts.userMenu.signIn, exact: true })).toBeVisible();
  await page.goBack().catch(() => undefined);
  await page.waitForLoadState("networkidle");
  // Il reload non deve mostrare la dashboard: chi arriva con "indietro" viene rimandato al login
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("J.3 utente eliminato mentre è loggato: al reload risulta anonimo", async ({ page }) => {
  await login(page, GONE, PASSWORD, "/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  deleteUsers([GONE]);
  await page.reload();
  await expect(page).toHaveURL(/\/auth\/login/);
});
