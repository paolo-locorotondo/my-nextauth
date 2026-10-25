import { expect } from "@playwright/test";
import { waitForLink as waitForLinkHttp } from "../helpers/http";

/** Subito prima di un'azione, per non prendere email vecchie. */
export const now = () => new Date(Date.now() - 1000);

/** Link dell'ultima email (EMAIL_PROVIDER=console) a `to` con oggetto che contiene `subject`. */
export async function waitForLink(to: string, subject: string, after: Date): Promise<string> {
  const link = await waitForLinkHttp(to, subject, after);
  expect(link).toMatch(/^https?:\/\//);
  return link;
}
