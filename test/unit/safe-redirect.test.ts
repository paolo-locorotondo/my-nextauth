import assert from "node:assert/strict";
import { test } from "node:test";
import { continueUrl, loginUrl, safeCallbackUrl } from "../../lib/auth/safe-redirect";

test("accetta path relativi con query e hash", () => {
  assert.equal(safeCallbackUrl("/dashboard"), "/dashboard");
  assert.equal(safeCallbackUrl("/orders?id=1&x=2#top"), "/orders?id=1&x=2#top");
  assert.equal(safeCallbackUrl("/a/../admin"), "/admin");
});

test("rifiuta URL esterni e trucchi di open redirect", () => {
  const bad = [
    "https://evil.com",
    "http://evil.com/dashboard",
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "/%2F%2Fevil.com",
    "/%5Cevil.com",
    "/%2fevil.com",
    "javascript:alert(1)",
    "dashboard",
    "/\tevil",
    "/\nevil",
    "",
    "/" + "a".repeat(3000),
  ];
  for (const raw of bad) assert.equal(safeCallbackUrl(raw), null, `doveva rifiutare: ${JSON.stringify(raw)}`);
});

test("rifiuta i loop verso le pagine /auth", () => {
  assert.equal(safeCallbackUrl("/auth/login"), null);
  assert.equal(safeCallbackUrl("/auth/continue?callbackUrl=/x"), null);
  assert.equal(safeCallbackUrl("/auth"), null);
  // ma non i path che iniziano solo per "auth"
  assert.equal(safeCallbackUrl("/authors"), "/authors");
});

test("fallback, null e undefined", () => {
  assert.equal(safeCallbackUrl(null), null);
  assert.equal(safeCallbackUrl(undefined, "/home"), "/home");
  assert.equal(safeCallbackUrl("https://evil.com", "/dashboard"), "/dashboard");
});

test("loginUrl e continueUrl codificano solo callbackUrl validi", () => {
  assert.equal(loginUrl("/admin?tab=1"), "/auth/login?callbackUrl=%2Fadmin%3Ftab%3D1");
  assert.equal(loginUrl("//evil.com"), "/auth/login");
  assert.equal(continueUrl("/dashboard"), "/auth/continue?callbackUrl=%2Fdashboard");
  assert.equal(continueUrl(null), "/auth/continue");
});
