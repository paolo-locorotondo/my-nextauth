"use client";

import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import Field, { fieldProps, focusFirstError } from "@/components/auth/Field";
import { AuthCard, FormMessage, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { clientErrorMessage } from "@/lib/auth/errors";
import { passwordError } from "@/lib/auth/password-policy";
import { texts } from "@/lib/auth/texts";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clear = (k: string) => setFieldErrors((f) => (f[k] ? { ...f, [k]: "" } : f));

  function validate(): Record<string, string> {
    const f: Record<string, string> = {};
    if (!current) f.current = texts.validation.currentPassword;
    const pwd = passwordError(password);
    if (pwd) f.password = pwd;
    else if (password === current) f.password = texts.changePassword.samePassword;
    else if (password !== confirm) f.confirm = texts.register.passwordMismatch;
    return f;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    const invalid = validate();
    setFieldErrors(invalid);
    setError(null);
    if (Object.keys(invalid).length > 0) {
      focusFirstError(["current", "password", "confirm"], invalid);
      return;
    }
    setPending(true);

    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: password,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      setError(clientErrorMessage(error));
      return;
    }
    setCurrent("");
    setPassword("");
    setConfirm("");
    setSuccess(true);
  }

  return (
    <AuthCard title={texts.changePassword.title}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage kind="error">{error}</FormMessage>
        <FormMessage kind="success">{success ? texts.changePassword.success : null}</FormMessage>
        <Field id="current" label={texts.changePassword.currentPassword} error={fieldErrors.current}>
          <PasswordInput
            {...fieldProps("current", fieldErrors.current)}
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              clear("current");
            }}
          />
        </Field>
        <Field id="password" label={texts.changePassword.newPassword} error={fieldErrors.password}>
          <PasswordInput
            {...fieldProps("password", fieldErrors.password)}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clear("password");
            }}
          />
        </Field>
        <Field id="confirm" label={texts.changePassword.confirmPassword} error={fieldErrors.confirm}>
          <PasswordInput
            {...fieldProps("confirm", fieldErrors.confirm)}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clear("confirm");
            }}
          />
        </Field>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? texts.common.loading : texts.changePassword.submit}
        </button>
      </form>
    </AuthCard>
  );
}
