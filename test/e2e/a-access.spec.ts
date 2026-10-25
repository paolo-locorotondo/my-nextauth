/** Sezione A del piano manuale: accesso da anonimo e da loggato. */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { ADMIN, login } from "./helpers";

test("A.1 home pubblica con Accedi e Registrati, senza redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Accedi" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Registrati" }).first()).toBeVisible();
});

test("A.2 /dashboard da anonimo → login con callbackUrl", async ({ page }) => {
  await page.goto("/dashboard?tab=1");
  await expect(page).toHaveURL("/auth/login?callbackUrl=%2Fdashboard%3Ftab%3D1");
});

for (const [path, encoded] of [
  ["/admin", "%2Fadmin"],
  ["/user/change-password", "%2Fuser%2Fchange-password"],
]) {
  test(`A.3 ${path} da anonimo → login con callbackUrl`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(`/auth/login?callbackUrl=${encoded}`);
  });
}

test("A.4 /api/demo/me da anonimo → 401 JSON", async ({ request }) => {
  const res = await request.get("/api/demo/me");
  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ error: "Unauthorized" });
});

test("A.5 /auth/error mostra il messaggio italiano e Riprova porta al login", async ({ page }) => {
  await page.goto("/auth/error?error=state_mismatch");
  await expect(page.getByText(texts.errors.state_mismatch)).toBeVisible();
  await page.getByRole("link", { name: texts.error.retry }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("A.6 da loggato /auth/login e /auth/register rimandano alla pagina di atterraggio", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/admin$/);
  for (const path of ["/auth/login", "/auth/register"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin$/);
  }
});
