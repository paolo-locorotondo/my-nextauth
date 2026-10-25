/**
 * Esegue un frammento TypeScript in un processo figlio con `server-only` risolto come sul server
 * (`--conditions=react-server`) e con le env indicate. Serve per i test che dipendono dalle env
 * lette all'import (lib/auth/env.ts) e che quindi non si possono rifare nel processo del test.
 */
import { spawnSync } from "node:child_process";

export function runTs(code: string, env: Record<string, string | undefined>) {
  const clean: Record<string, string | undefined> = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP };
  for (const [k, v] of Object.entries(env)) if (v !== undefined) clean[k] = v;
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", "--conditions=react-server", "--input-type=module", "-e", code],
    { cwd: process.cwd(), env: clean as NodeJS.ProcessEnv, encoding: "utf8", timeout: 60_000 },
  );
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
