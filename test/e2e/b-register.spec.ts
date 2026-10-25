/** Sezione B del piano manuale: registrazione e verifica email. */
import { expect, test, type Page } from "@playwright/test";
import { texts } from "../../lib/auth/texts";
import { deleteUsers } from "./db";
import { formError } from "./helpers";
import { now, waitForLink } from "./mail";

const stamp = Date.now();
const created: string[] = [];
const newUser = (tag: string) => {
  const email = `b-${tag}-${stamp}@example.com`;
  created.push(email);
  return { name: "Test B", email, password: "Bella-pass-1" };
};

test.afterAll(() => {
  deleteUsers(created);
});

async function fillRegister(page: Page, u: { name: string; email: string; password: string }, confirm = u.password) {
  await page.goto("/auth/register");
  await page.locator("#name").fill(u.name);
  await page.locator("#email").fill(u.email);
  await page.locator("#password").fill(u.password);
  await page.locator("#confirm").fill(confirm);
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
}

test("B.1 campi vuoti ed email non valida: messaggi nel form", async ({ page }) => {
  await page.goto("/auth/register");
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
  await expect(formError(page)).toHaveText(texts.validation.name);

  await page.locator("#name").fill("Mario");
  await page.locator("#email").fill("non-una-email");
  await page.getByRole("button", { name: texts.register.submit, exact: true }).click();
  await expect(formError(page)).toHaveText(texts.validation.email);
});

test("B.2 password e conferma diverse", async ({ page }) => {
  await fillRegister(page, newUser("mismatch"), "Diversa-pass-1");
  await expect(formError(page)).toHaveText(texts.register.passwordMismatch);
});

test("B.3 ogni regola della password mancante è segnalata", async ({ page }) => {
  for (const [pwd, msg] of [
    ["bella-pass-1", texts.password.upper],
    ["BELLA-PASS-1", texts.password.lower],
    ["Bella-pass-x", texts.password.digit],
    ["Bella1pass", texts.password.special],
  ] as const) {
    await fillRegister(page, { ...newUser("policy"), password: pwd });
    await expect(formError(page)).toHaveText(msg);
  }
});

test("B.4 registrazione valida → pagina di verifica; email inviata", async ({ page }) => {
  const u = newUser("ok");
  const at = now();
  await fillRegister(page, u);
  await expect(page).toHaveURL(/\/auth\/verify-email\?email=/);
  await expect(page.getByText(texts.verifyEmail.checkInbox(u.email))).toBeVisible();
  await waitForLink(u.email, texts.email.verify.subject, at);
});

test("B.6 link di verifica → login automatico, utente in attesa", async ({ page }) => {
  const u = newUser("verify");
  const at = now();
  await fillRegister(page, u);
  const link = await waitForLink(u.email, texts.email.verify.subject, at);
  await page.goto(link);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(texts.pending.title)).toBeVisible();
});

test("B.7 link di verifica manomesso → link non valido", async ({ page }) => {
  const u = newUser("tamper");
  const at = now();
  await fillRegister(page, u);
  const link = new URL(await waitForLink(u.email, texts.email.verify.subject, at));
  link.searchParams.set("token", `${link.searchParams.get("token")}x`);
  await page.goto(link.toString());
  await expect(page).toHaveURL(/\/auth\/verify-email\?error=/);
  await expect(page.getByText(texts.verifyEmail.invalidToken)).toBeVisible();
});

test("B.9 email già registrata: stessa pagina, nessun errore", async ({ page }) => {
  const u = newUser("dup");
  const at = now();
  await fillRegister(page, u);
  await waitForLink(u.email, texts.email.verify.subject, at);
  await fillRegister(page, u);
  await expect(page).toHaveURL(/\/auth\/verify-email\?email=/);
  await expect(formError(page)).toHaveCount(0);
});

test("B.8 login prima della verifica: errore e link per reinviare", async ({ page }) => {
  const u = newUser("unverified");
  await fillRegister(page, u);
  await expect(page).toHaveURL(/verify-email/);
  await page.goto("/auth/login");
  await page.locator("#email").fill(u.email);
  await page.locator("#password").fill(u.password);
  await page.getByRole("button", { name: texts.login.submit, exact: true }).click();
  await expect(formError(page)).toContainText(texts.errors.EMAIL_NOT_VERIFIED);
  await expect(page.getByRole("link", { name: texts.login.resendVerification })).toBeVisible();
});
