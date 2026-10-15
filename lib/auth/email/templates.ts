import { texts } from "../texts";

export type AuthEmailKind = "verify" | "reset" | "existing";

/** Link secondario facoltativo, mostrato sotto il pulsante principale. */
export type SecondaryLink = { label: string; url: string };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Email transazionale minimale (HTML inline-styled + testo semplice). */
export function renderAuthEmail(kind: AuthEmailKind, name: string, url: string, secondary?: SecondaryLink) {
  const t = texts.email[kind];
  const safeName = name || "";
  const safeUrl = escapeHtml(url);

  const secondaryHtml = secondary
    ? `<p style="font-size:14px;margin:0 0 24px"><a href="${escapeHtml(secondary.url)}" style="color:#2563eb">${escapeHtml(secondary.label)}</a></p>`
    : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
    <tr><td>
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(t.heading)}</h1>
      <p style="font-size:15px;line-height:1.5;margin:0 0 24px">${escapeHtml(t.body(safeName))}</p>
      <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">${escapeHtml(t.cta)}</a></p>
      ${secondaryHtml}
      <p style="font-size:12px;color:#64748b;margin:0">${escapeHtml(texts.email.footer)}<br><span style="word-break:break-all">${safeUrl}</span></p>
    </td></tr>
  </table>
</body></html>`;

  const secondaryText = secondary ? `${secondary.label}: ${secondary.url}\n` : "";
  const text = `${t.heading}\n\n${t.body(name || "")}\n\n${t.cta}: ${url}\n${secondaryText}`;

  return { subject: t.subject, html, text };
}
