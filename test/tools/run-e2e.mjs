/**
 * Lancia i profili E2E uno dopo l'altro (ognuno avvia il proprio server, vedi playwright.config.ts).
 * Gli argomenti (es. un nome di file) sono passati a Playwright. Esce con 1 se un profilo fallisce.
 */
import { spawnSync } from "node:child_process";

const profiles = ["default", "ratelimit", "allowlist"];
const args = process.argv.slice(2);
const failed = [];

for (const profile of profiles) {
  console.log(`\n══ Profilo E2E: ${profile} ══`);
  const r = spawnSync("npx", ["playwright", "test", "--pass-with-no-tests", ...args], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, E2E_PROFILE: profile },
  });
  if (r.status !== 0) failed.push(profile);
}

if (failed.length) {
  console.error(`\nProfili falliti: ${failed.join(", ")}`);
  process.exit(1);
}
