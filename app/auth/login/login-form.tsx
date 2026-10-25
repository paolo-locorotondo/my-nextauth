"use client";

import Link from "next/link";
import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import ProviderButtons, { type ProviderButtonsProps } from "@/components/auth/ProviderButtons";
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { continueUrl } from "@/lib/auth/safe-redirect";
import { texts } from "@/lib/auth/texts";

type Props = ProviderButtonsProps & { notice: string | null };

const withCallback = (path: string, callbackUrl?: string | null) =>
  callbackUrl ? `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}` : path;

export default function LoginForm({ providers, callbackUrl, notice }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setUnverified(false);

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: continueUrl(callbackUrl),
    });

    if (error) {
      setError(clientErrorMessage(error));
      setUnverified(error.code === "EMAIL_NOT_VERIFIED");
      setPending(false);
      return;
    }
    // Navigazione completa verso lo smistamento post-login (callbackUrl o landingForRole)
    window.location.assign(continueUrl(callbackUrl));
  }

  const hasProviders = providers.google || !!providers.oidc;

  return (
    <AuthCard title={texts.login.title} subtitle={texts.login.subtitle}>
      {notice === "password-updated" && <FormMessage kind="success">{texts.login.passwordUpdated}</FormMessage>}

      <ProviderButtons providers={providers} callbackUrl={callbackUrl} />

      {hasProviders && (
        <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          {texts.common.or}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage kind="error">
          {error}
          {unverified && (
            <>
              {" "}
              <Link href={`${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(email)}`} className="underline">
                {texts.login.resendVerification}
              </Link>
            </>
          )}
        </FormMessage>

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

        <div>
          <label htmlFor="password" className={labelClass}>
            {texts.common.password}
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-2 text-right text-sm">
            <Link href={AUTH_ROUTES.forgotPassword} className="text-blue-600 hover:underline">
              {texts.login.forgotPassword}
            </Link>
          </p>
        </div>

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? texts.common.loading : texts.login.submit}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        {texts.login.noAccount}{" "}
        <Link href={withCallback(AUTH_ROUTES.register, callbackUrl)} className={linkClass}>
          {texts.login.register}
        </Link>
      </p>
    </AuthCard>
  );
}
