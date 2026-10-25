/**
 * Helper condivisi dai test che parlano con l'app in esecuzione (smoke e test/http):
 * client HTTP con cookie jar, lettura dei link dalle email di sviluppo, costanti di ambiente.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const BASE = (process.env.SMOKE_BASE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
export const API = `${BASE}/api/auth`;
export const MAILBOX = path.join(process.cwd(), ".dev-mailbox.jsonl");
export const ADMIN = { email: process.env.SEED_ADMIN_EMAIL || "admin@example.com", password: process.env.SEED_ADMIN_PASSWORD || "Admin123!" };

// ── HTTP con cookie jar ────────────────────────────────────────────────

export class Client {
  cookies = new Map<string, string>();
  /** IP fisso per il client (rate limit per IP); di default uno casuale per richiesta. */
  constructor(private ip?: string) {}

  private store(res: Response) {
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      const value = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a)) || value === "";
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async request(url: string, init: RequestInit & { json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("Origin")) headers.set("Origin", BASE);
    headers.set("x-forwarded-for", this.ip ?? `10.${rand()}.${rand()}.${rand()}`);
    if (this.cookies.size) headers.set("Cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (init.json !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(init.json);
      init.method ??= "POST";
    }
    const res = await fetch(url.startsWith("http") ? url : BASE + url, { ...init, headers, redirect: "manual" });
    this.store(res);
    return res;
  }

  post(endpoint: string, json: unknown) {
    return this.request(API + endpoint, { json });
  }
}

export const rand = () => Math.floor(Math.random() * 254) + 1;
export const location = (res: Response) => {
  const loc = res.headers.get("location");
  return loc ? new URL(loc, BASE).pathname + new URL(loc, BASE).search : null;
};
export const body = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Attende l'email (inviata in background con after()) e ne estrae il link. */
export async function waitForLink(to: string, subjectIncludes: string, after: Date): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const content = await readFile(MAILBOX, "utf8").catch(() => "");
    const mails = content
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { to: string; subject: string; text: string; sentAt: string })
      .filter((m) => m.to === to && m.subject.includes(subjectIncludes) && new Date(m.sentAt) >= after);
    const last = mails.at(-1);
    const link = last?.text.match(/https?:\/\/\S+/)?.[0];
    if (link) return link;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Nessuna email "${subjectIncludes}" per ${to} in ${MAILBOX} (EMAIL_PROVIDER=console?)`);
}
