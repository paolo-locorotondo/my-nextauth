import { defineConfig, devices } from "@playwright/test";
import { E2E_BOOTSTRAP_ADMIN } from "./test/e2e/constants";

/**
 * Test end-to-end nel browser (Chromium). Avvia SEMPRE il proprio server di sviluppo, su una porta
 * dedicata (3100) e con le variabili che servono ai test: non dipende dal server che hai acceso tu.
 *
 * Alcune prove richiedono un server configurato diversamente, quindi i test sono divisi in profili,
 * ciascuno col suo server. Due `next dev` nella stessa cartella non possono convivere, perciò i
 * profili girano uno dopo l'altro: li lancia `test/tools/run-e2e.mjs`.
 *
 *   npm run test:e2e                              tutti i profili
 *   npm run test:e2e -- b-register                filtra per nome file
 *   E2E_PROFILE=allowlist npx playwright test     un solo profilo
 */
const PORT = Number(process.env.E2E_PORT || 3100);
const BASE = `http://localhost:${PORT}`;

const PROFILES = {
  /** Impostazioni base: rate limit e white list spenti. */
  default: {
    env: { AUTH_RATE_LIMIT: "", AUTH_ALLOWLIST: "" },
    testIgnore: [/k-ratelimit/, /o-allowlist\.spec/],
  },
  /** K.1: rate limit acceso. */
  ratelimit: {
    env: { AUTH_RATE_LIMIT: "on", AUTH_ALLOWLIST: "" },
    testMatch: /k-ratelimit\.spec/,
  },
  /** Sezione O: white list accesa, con un admin di bootstrap noto. */
  allowlist: {
    env: { AUTH_RATE_LIMIT: "", AUTH_ALLOWLIST: "on", AUTH_ADMIN_EMAILS: E2E_BOOTSTRAP_ADMIN },
    testMatch: /o-allowlist\.spec/,
  },
} as const;

const name = (process.env.E2E_PROFILE || "default") as keyof typeof PROFILES;
const profile = PROFILES[name];
if (!profile) throw new Error(`E2E_PROFILE sconosciuto: ${name} (${Object.keys(PROFILES).join(" | ")})`);

export default defineConfig({
  testDir: "./test/e2e",
  ...("testMatch" in profile ? { testMatch: profile.testMatch } : {}),
  ...("testIgnore" in profile ? { testIgnore: [...profile.testIgnore] } : {}),
  // Un solo worker: i test condividono il DB e l'utente di seed
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // Il dev server compila le pagine alla prima visita: 5 s di default sono pochi
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: BASE, trace: "retain-on-failure", locale: "it-IT" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: BASE,
    // Mai riusare un server esistente: potrebbe avere env diverse da quelle attese dai test
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      BETTER_AUTH_URL: BASE,
      EMAIL_PROVIDER: "console",
      ...profile.env,
    },
  },
});
