import type { EmailSender } from "./types";

/** https://resend.com/docs/api-reference/emails/send-email */
export function resendSender(apiKey: string, from: string): EmailSender {
  return {
    async send({ to, subject, html, text }) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    },
  };
}
