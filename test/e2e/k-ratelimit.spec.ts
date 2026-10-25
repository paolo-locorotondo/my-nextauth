/** K.1: rate limit sul login (profilo "ratelimit": server con AUTH_RATE_LIMIT=on). */
import { expect, test } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { formError } from "./helpers";

test("K.1 la sesta password errata in un minuto mostra il messaggio di troppi tentativi", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator("#email").fill("nessuno@example.com");
  await page.locator("#password").fill("Sbagliata-1");
  for (let i = 1; i <= 6; i++) {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/sign-in/email")),
      page.getByRole("button", { name: texts.login.submit, exact: true }).click(),
    ]);
    expect(res.status()).toBe(i < 6 ? 401 : 429);
  }
  await expect(formError(page)).toHaveText(texts.errors.TOO_MANY_REQUESTS);
});
