"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import Field, { fieldProps, focusFirstError } from "@/components/auth/Field";
import { AuthCard, FormMessage, linkClass, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { passwordError } from "@/lib/auth/password-policy";
import { texts } from "@/lib/auth/texts";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clear = (k: string) => setFieldErrors((f) => (f[k] ? { ...f, [k]: "" } : f));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid: Record<string, string> = {};
    const pwd = passwordError(password);
    if (pwd) invalid.password = pwd;
    else if (password !== confirm) invalid.confirm = texts.register.passwordMismatch;
    setFieldErrors(invalid);
    setError(null);
    if (Object.keys(invalid).length > 0) {
      focusFirstError(["password", "confirm"], invalid);
      return;
    }
    setPending(true);

    // Revoca anche le sessioni esistenti (revokeSessionsOnPasswordReset in server.ts)
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setError(clientErrorMessage(error));
      setInvalidToken(error.code === "INVALID_TOKEN");
      setPending(false);
      return;
    }
    router.push(`${AUTH_ROUTES.login}?notice=password-updated`);
  }

  return (
    <AuthCard title={texts.resetPassword.title}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage kind="error">
          {error}
          {invalidToken && (
            <>
              {" "}
              <Link href={AUTH_ROUTES.forgotPassword} className="underline">
                {texts.resetPassword.requestNew}
              </Link>
            </>
          )}
        </FormMessage>
        <Field id="password" label={texts.resetPassword.newPassword} error={fieldErrors.password}>
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
        <Field id="confirm" label={texts.register.confirmPassword} error={fieldErrors.confirm}>
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
          {pending ? texts.common.loading : texts.resetPassword.submit}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href={AUTH_ROUTES.login} className={linkClass}>
          {texts.common.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}
