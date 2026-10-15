import { appendFile } from "node:fs/promises";
import path from "node:path";
import type { EmailSender } from "./types";

/** File letto dallo smoke test per recuperare i link di verifica/reset. */
export const DEV_MAILBOX_FILE = path.join(process.cwd(), ".dev-mailbox.jsonl");

/**
 * Adapter di sviluppo: non invia nulla, stampa l'email in console e la
 * accoda in .dev-mailbox.jsonl (ignorato da git).
 */
export function consoleSender(): EmailSender {
  return {
    async send(message) {
      console.info(`\n[email] → ${message.to}\n  ${message.subject}\n  ${message.text.replace(/\n/g, "\n  ")}\n`);
      await appendFile(DEV_MAILBOX_FILE, JSON.stringify({ ...message, sentAt: new Date().toISOString() }) + "\n");
    },
  };
}
