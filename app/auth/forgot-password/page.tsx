"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { emailSchema } from "@/lib/auth/password-policy";
import { texts } from "@/lib/auth/texts";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) {
      setError(texts.validation.email);
      return;
    }
    setPending(true);
    setError(null);

    // La risposta è identica che l'email esista o no (niente user enumeration)
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: AUTH_ROUTES.resetPassword });
    setPending(false);
    if (error) {
      setError(clientErrorMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard title={texts.forgotPassword.title} subtitle={texts.forgotPassword.intro}>
      {sent ? (
        <FormMessage kind="success">{texts.forgotPassword.sent}</FormMessage>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormMessage kind="error">{error}</FormMessage>
          <div>
            <label htmlFor="email" className={labelClass}>
              {texts.common.email}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? texts.common.loading : texts.forgotPassword.submit}
          </button>
        </form>
      )}
      <p className="text-center text-sm">
        <Link href={AUTH_ROUTES.login} className={linkClass}>
          {texts.common.backToLogin}
        </Link>
      </p>
    </AuthCard>
  );
}
