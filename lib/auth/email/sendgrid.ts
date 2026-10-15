import type { EmailSender } from "./types";

/** "Nome <email>" → { name, email } come richiesto da SendGrid. */
function parseFrom(from: string): { email: string; name?: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || undefined, email: m[2] } : { email: from.trim() };
}

/** https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send */
export function sendgridSender(apiKey: string, from: string): EmailSender {
  return {
    async send({ to, subject, html, text }) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: parseFrom(from),
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
    },
  };
}
