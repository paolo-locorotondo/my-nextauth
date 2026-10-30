import assert from "node:assert/strict";
import { test } from "node:test";
import { ALLOWLIST_LIMITS, allowlistPatternSchema, matchesAllowlist } from "../../lib/auth/allowlist-rules";

test("email esatta, case-insensitive", () => {
  assert.ok(matchesAllowlist("Mario@X.it", ["mario@x.it"]));
  assert.ok(!matchesAllowlist("luigi@x.it", ["mario@x.it"]));
});

test("dominio: copre tutte le email di quel dominio, non i domini che lo contengono", () => {
  assert.ok(matchesAllowlist("anna@azienda.it", ["@azienda.it"]));
  assert.ok(matchesAllowlist("ANNA@AZIENDA.IT", ["@azienda.it"]));
  assert.ok(!matchesAllowlist("anna@notazienda.it", ["@azienda.it"]));
  assert.ok(!matchesAllowlist("anna@azienda.it.evil.com", ["@azienda.it"]));
});

test("lista vuota non ammette nessuno", () => {
  assert.ok(!matchesAllowlist("mario@x.it", []));
});

test("schema voci: normalizza e rifiuta le voci malformate", () => {
  assert.equal(allowlistPatternSchema.parse("  Mario@X.IT "), "mario@x.it");
  assert.equal(allowlistPatternSchema.parse("@AZIENDA.it"), "@azienda.it");
  for (const bad of ["foo", "@", "a@b@c", "@dominio", "mario@", "", "con spazio@x.it"]) {
    assert.ok(!allowlistPatternSchema.safeParse(bad).success, `doveva rifiutare: ${JSON.stringify(bad)}`);
  }
});

test("una voce più lunga del limite è rifiutata", () => {
  const long = `${"a".repeat(ALLOWLIST_LIMITS.pattern)}@x.it`;
  const r = allowlistPatternSchema.safeParse(long);
  assert.ok(!r.success);
  assert.equal(r.error.issues[0]?.message, `Massimo ${ALLOWLIST_LIMITS.pattern} caratteri`);
});
