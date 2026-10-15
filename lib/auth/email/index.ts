import "server-only";
import { env } from "../env";
import { consoleSender } from "./console";
import { resendSender } from "./resend";
import { sendgridSender } from "./sendgrid";
import { renderAuthEmail, type AuthEmailKind, type SecondaryLink } from "./templates";
import type { EmailSender } from "./types";

let sender: EmailSender | undefined;

function getEmailSender(): EmailSender {
  if (sender) return sender;
  switch (env.emailProvider) {
    case "console":
      sender = consoleSender();
      break;
    case "resend":
      if (!env.RESEND_API_KEY) throw new Error("EMAIL_PROVIDER=resend ma RESEND_API_KEY è vuota");
      sender = resendSender(env.RESEND_API_KEY, env.emailFrom);
      break;
    case "sendgrid":
      if (!env.SENDGRID_API_KEY) throw new Error("EMAIL_PROVIDER=sendgrid ma SENDGRID_API_KEY è vuota");
      sender = sendgridSender(env.SENDGRID_API_KEY, env.emailFrom);
      break;
    default:
      throw new Error("EMAIL_PROVIDER non configurato (console | resend | sendgrid)");
  }
  return sender;
}

/**
 * Invia un'email di autenticazione. Non lancia mai: gli errori vengono
 * loggati, perché Better Auth la invoca in background (vedi
 * advanced.backgroundTasks in server.ts) e la risposta HTTP non deve
 * dipendere dall'esito dell'invio (evita timing attack / user enumeration).
 */
export async function sendAuthEmail(
  kind: AuthEmailKind,
  user: { email: string; name: string },
  url: string,
  secondary?: SecondaryLink,
) {
  try {
    const { subject, html, text } = renderAuthEmail(kind, user.name, url, secondary);
    await getEmailSender().send({ to: user.email, subject, html, text });
  } catch (err) {
    console.error(`[auth] invio email "${kind}" a ${user.email} fallito:`, err);
  }
}
