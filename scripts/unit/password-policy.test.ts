import assert from "node:assert/strict";
import { test } from "node:test";
import { PASSWORD_POLICY } from "../../lib/auth/config";
import { emailSchema, passwordError } from "../../lib/auth/password-policy";
import { texts } from "../../lib/auth/texts";

test("password valida", () => {
  assert.equal(passwordError("Password1!"), null);
  assert.equal(passwordError("àèìZ1?xyz"), null);
});

test("le lettere accentate non contano come maiuscole/minuscole (regex ASCII, come order-app)", () => {
  assert.equal(passwordError("Àbcdef1?xyz"), texts.password.upper);
});

test("ogni regola produce il suo messaggio", () => {
  assert.equal(passwordError("Ab1!"), texts.password.min(PASSWORD_POLICY.min));
  assert.equal(passwordError("A1!" + "a".repeat(PASSWORD_POLICY.max)), texts.password.max(PASSWORD_POLICY.max));
  assert.equal(passwordError("password1!"), texts.password.upper);
  assert.equal(passwordError("PASSWORD1!"), texts.password.lower);
  assert.equal(passwordError("Password!!"), texts.password.digit);
  assert.equal(passwordError("Password12"), texts.password.special);
});

test("email", () => {
  assert.ok(emailSchema.safeParse("mario.rossi@example.com").success);
  assert.ok(!emailSchema.safeParse("mario").success);
  assert.ok(!emailSchema.safeParse("mario@").success);
});
