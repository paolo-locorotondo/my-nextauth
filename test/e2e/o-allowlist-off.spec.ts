/** O.11 e O.12: con la white list spenta (profilo di default). */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { deleteUsers } from "./db";
import { ADMIN, login } from "./helpers";

const EMAIL = `o12-${Date.now()}@qualunque.example.net`;

test.afterAll(() => {
  deleteUsers([EMAIL]);
});

test("O.11 pagina Email ammesse con la funzione spenta: avviso", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin/allowed-emails");
  await expect(page.getByText("non è attiva")).toBeVisible();
});

test("O.12 con la funzione spenta chiunque può registrarsi", async ({ page }) => {
  await page.goto("/auth/register");
  await page.locator("#name").fill("O12");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill("Prova-pass-1");
  await page.locator("#confirm").fill("Prova-pass-1");
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email\?email=/);
});
