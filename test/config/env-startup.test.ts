/**
 * Avvio in produzione con configurazione errata (copre M.2). Non serve il server.
 *
 *   npm run test:config
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { runTs } from "../helpers/child";

const LOAD = `await import("./lib/auth/env.ts"); console.log("LOADED");`;
const PROD = { NODE_ENV: "production", BETTER_AUTH_URL: "https://example.com" };

test("M.2 produzione senza BETTER_AUTH_SECRET → errore chiaro", () => {
  const r = runTs(LOAD, PROD);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /BETTER_AUTH_SECRET mancante o troppo corto/);
});

test("M.2 produzione con secret di 31 caratteri → errore chiaro", () => {
  const r = runTs(LOAD, { ...PROD, BETTER_AUTH_SECRET: "x".repeat(31) });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /BETTER_AUTH_SECRET mancante o troppo corto/);
});

test("produzione senza BETTER_AUTH_URL → errore chiaro", () => {
  const r = runTs(LOAD, { NODE_ENV: "production", BETTER_AUTH_SECRET: "x".repeat(32) });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /BETTER_AUTH_URL mancante/);
});

test("produzione con secret di 32 caratteri → si avvia", () => {
  const r = runTs(LOAD, { ...PROD, BETTER_AUTH_SECRET: "x".repeat(32) });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /LOADED/);
});

test("sviluppo senza secret → si avvia (il controllo vale solo in produzione)", () => {
  const r = runTs(LOAD, { NODE_ENV: "development" });
  assert.equal(r.status, 0, r.stderr);
});
