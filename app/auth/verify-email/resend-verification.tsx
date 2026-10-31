"use client";

import Link from "next/link";
import { useState } from "react";
import Field, { fieldProps, focusFirstError } from "@/components/auth/Field";
import { FormMessage, inputClass, linkClass, secondaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES, FIELD_LIMITS } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { emailSchema } from "@/lib/auth/password-policy";
import { continueUrl } from "@/lib/auth/safe-redirect";
import { texts } from "@/lib/auth/texts";

export default function ResendVerification({ initialEmail, callbackUrl }: { initialEmail: string; callbackUrl: string | null }) {
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailSchema.safeParse(email).success) {
      setEmailError(texts.validation.email);
      focusFirstError(["email"], { email: texts.validation.email });
      return;
    }
    setEmailError("");
    setPending(true);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: continueUrl(callbackUrl) });
    setPending(false);
    if (error) {
      setError(clientErrorMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage kind="error">{error}</FormMessage>
        <FormMessage kind="success">{sent ? texts.verifyEmail.resent : null}</FormMessage>
        {!initialEmail && (
          <Field id="email" label={texts.common.email} error={emailError} max={FIELD_LIMITS.email} value={email}>
            <input
              {...fieldProps("email", emailError)}
              type="email"
              autoComplete="email"
              required
              maxLength={FIELD_LIMITS.email}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={inputClass}
            />
          </Field>
        )}
        <button type="submit" disabled={pending} className={secondaryButtonClass}>
          {pending ? texts.common.loading : texts.verifyEmail.resend}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href={AUTH_ROUTES.login} className={linkClass}>
          {texts.common.backToLogin}
        </Link>
      </p>
    </>
  );
}
