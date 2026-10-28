/** Sezione C del piano manuale: login con email e password. */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { ADMIN, apriMenuUtente, formError, login } from "./helpers";

test("C.1 login ADMIN → atterraggio su /admin", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/admin\/users$/);
});

test("C.2 logout, poi login da /dashboard → torna su /dashboard", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await apriMenuUtente(page);
  await page.getByRole("button", { name: texts.userMenu.signOut }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: texts.userMenu.signIn })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/auth/login?callbackUrl=%2Fdashboard");
  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#password").fill(ADMIN.password);
  await page.getByRole("button", { name: texts.login.submit, exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("C.3 password errata ed email inesistente: stesso messaggio", async ({ page }) => {
  for (const email of [ADMIN.email, "nessuno@example.com"]) {
    await page.goto("/auth/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("Sbagliata1!");
    await page.getByRole("button", { name: texts.login.submit, exact: true }).click();
    await expect(formError(page)).toHaveText(texts.errors.INVALID_EMAIL_OR_PASSWORD);
  }
});

test("C.4 il pulsante occhio mostra e nasconde la password", async ({ page }) => {
  await page.goto("/auth/login");
  const input = page.locator("#password");
  await input.fill("Segreta1!");
  await expect(input).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: texts.common.showPassword }).click();
  await expect(input).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: texts.common.hidePassword }).click();
  await expect(input).toHaveAttribute("type", "password");
});

test("C.5 callbackUrl esterno ignorato: atterra sulla pagina di ruolo", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/auth/login?callbackUrl=https://evil.com");
  await expect(page).toHaveURL(/\/admin\/users$/);
  expect(new URL(page.url()).hostname).toBe("localhost");
});
