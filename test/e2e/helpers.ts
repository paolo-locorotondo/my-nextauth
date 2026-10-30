import { expect, type Locator, type Page } from "@playwright/test";
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

/** Apre la tendina del menu utente (l'unico pulsante con aria-haspopup="menu" nell'header); "Esci" e "Cambia password" stanno lì dentro. */
export async function apriMenuUtente(page: Page) {
  const pulsante = page.getByRole("banner").locator('button[aria-haspopup="menu"]');
  await pulsante.click();
  await expect(pulsante).toHaveAttribute("aria-expanded", "true");
}

const pageOf = (c: Locator | Page): Page => ("page" in c && typeof c.page === "function" ? c.page() : (c as Page));

/** Apre il menu contestuale sul nome di una riga ("Azioni per {label}") e sceglie la voce indicata. */
export async function menuItem(container: Locator | Page, label: string | RegExp, item: string) {
  await container.getByRole("button", { name: typeof label === "string" ? `Azioni per ${label}` : label }).click();
  await pageOf(container).getByRole("menuitem", { name: item, exact: true }).click();
}

/** Elimina dal menu contestuale: voce "Elimina", poi conferma "Sì, elimina" (o "Annulla" se `confirm` è false). */
export async function deleteFromMenu(container: Locator | Page, label: string | RegExp, confirm = true) {
  await menuItem(container, label, "Elimina");
  await pageOf(container).getByRole("menu").getByRole("button", { name: confirm ? /^Sì, elimina/ : "Annulla" }).click();
}
