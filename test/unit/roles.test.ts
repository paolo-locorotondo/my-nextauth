import assert from "node:assert/strict";
import { test } from "node:test";
import { landingForRole } from "../../lib/auth/config";
import { hasRole, isAdmin, isPending, isRole } from "../../lib/auth/roles";

test("isRole", () => {
  assert.ok(isRole("ADMIN"));
  assert.ok(!isRole("admin"));
  assert.ok(!isRole(undefined));
  assert.ok(!isRole(42));
});

test("hasRole: stringa, array, nessun ruolo richiesto", () => {
  const user = { role: "USER" };
  assert.ok(hasRole(user));
  assert.ok(hasRole(user, "USER"));
  assert.ok(hasRole(user, ["USER", "ADMIN"]));
  assert.ok(!hasRole(user, "ADMIN"));
  assert.ok(!hasRole(null));
  assert.ok(!hasRole(undefined, "USER"));
});

test("ruoli sconosciuti non passano mai un controllo di ruolo", () => {
  assert.ok(!hasRole({ role: "SUPERUSER" }, "ADMIN"));
  assert.ok(!hasRole({ role: null }, "USER"));
  assert.ok(!isAdmin({ role: "SUPERUSER" }));
});

test("isPending e isAdmin", () => {
  assert.ok(isPending({ role: "NUOVO" }));
  assert.ok(!isPending({ role: "USER" }));
  assert.ok(!isPending(null));
  assert.ok(isAdmin({ role: "ADMIN" }));
  assert.ok(!isAdmin({ role: "USER" }));
});

test("landingForRole", () => {
  assert.equal(landingForRole("ADMIN"), "/admin");
  assert.equal(landingForRole("USER"), "/dashboard");
  assert.equal(landingForRole("NUOVO"), "/dashboard");
  assert.equal(landingForRole(undefined), "/dashboard");
});
