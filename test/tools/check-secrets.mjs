/**
 * Cerca il VALORE dei segreti di .env nei file serviti al browser (e in quelli del server).
 *
 *   npm run build
 *   node test/tools/check-secrets.mjs
 *
 * Il NOME di una variabile (es. BETTER_AUTH_SECRET) compare legittimamente nel codice delle
 * librerie che la leggono a runtime: è un falso allarme. Qui si cerca solo il valore.
 * Non stampa mai i valori. Esce con codice 1 se ne trova uno in .next/static.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const KEYS = ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_SECRET", "OIDC_CLIENT_SECRET", "RESEND_API_KEY", "SENDGRID_API_KEY", "POSTGRES_PASSWORD"];

const envFile = path.join(root, ".env");
if (!fs.existsSync(envFile)) {
  console.error("Manca .env nella cartella corrente.");
  process.exit(2);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((f) => {
    const p = path.join(d, f.name);
    return f.isDirectory() ? walk(p) : [p];
  });

let leaked = false;
for (const dir of [".next/static", ".next/server"]) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) {
    console.log(`${dir}: assente (esegui prima "npm run build")`);
    continue;
  }
  const files = walk(full);
  console.log(`${dir}: ${files.length} file`);
  for (const key of KEYS) {
    const value = env[key];
    if (!value || value.length < 6) {
      console.log(`  ${key.padEnd(22)} vuota o troppo corta: non verificabile`);
      continue;
    }
    const hits = files.filter((f) => {
      try {
        return fs.readFileSync(f, "utf8").includes(value);
      } catch {
        return false;
      }
    });
    // Nel codice del server il valore non deve comparire come stringa letterale: va letto da process.env
    console.log(`  ${key.padEnd(22)} ${hits.length ? `TROVATO in ${hits.length} file (es. ${hits[0].replace(root, "")})` : "assente"}`);
    if (hits.length && dir === ".next/static") leaked = true;
  }
}
console.log(leaked ? "\nSEGRETO NEL BUNDLE DEL BROWSER: non pubblicare questa build." : "\nOK: nessun segreto nei file serviti al browser.");
process.exit(leaked ? 1 : 0);
