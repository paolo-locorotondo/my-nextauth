import { expect, type Page } from "@playwright/test";
import { ADMIN } from "../helpers/http";

export { ADMIN };

/** Login dal form, come un utente. Attende l'atterraggio fuori da /auth/login. */
export async function login(page: Page, email: string, password: string, from = "/auth/login") {
  await page.goto(from);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Accedi", exact: true }).click();
  // Il primo accesso a una pagina la fa compilare al dev server: attesa più lunga del default
  await expect(page).not.toHaveURL(/\/auth\/(login|continue)/, { timeout: 30_000 });
}

/** Messaggio di errore del form (FormMessage), escluso il "route announcer" di Next che ha anch'esso role=alert. */
export const formError = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
