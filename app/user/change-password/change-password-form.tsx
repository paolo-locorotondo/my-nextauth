"use client";

import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import { AuthCard, FormMessage, labelClass, primaryButtonClass } from "@/components/auth/ui";
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

  function validate(): string | null {
    const pwd = passwordError(password);
    if (pwd) return pwd;
    if (password === current) return texts.changePassword.samePassword;
    if (password !== confirm) return texts.register.passwordMismatch;
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);

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
        <div>
          <label htmlFor="current" className={labelClass}>
            {texts.changePassword.currentPassword}
          </label>
          <PasswordInput id="current" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            {texts.changePassword.newPassword}
          </label>
          <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirm" className={labelClass}>
            {texts.changePassword.confirmPassword}
          </label>
          <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? texts.common.loading : texts.changePassword.submit}
        </button>
      </form>
    </AuthCard>
  );
}
