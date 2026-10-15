"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { continueUrl } from "@/lib/auth/safe-redirect";
import { texts } from "@/lib/auth/texts";
import { FormMessage, secondaryButtonClass } from "./ui";

/** Provider attivi, passati dal server (lib/auth/env.ts → providers). */
export type ProviderButtonsProps = {
  providers: { google: boolean; oidc: { id: string; label: string } | null };
  callbackUrl?: string | null;
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function ProviderButtons({ providers, callbackUrl }: ProviderButtonsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!providers.google && !providers.oidc) return null;

  async function signInWith(provider: string) {
    setPending(provider);
    setError(null);
    // Anche il provider OIDC (plugin genericOAuth) si avvia con signIn.social
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: continueUrl(callbackUrl),
      newUserCallbackURL: continueUrl(callbackUrl),
      errorCallbackURL: AUTH_ROUTES.error,
    });
    // In caso di successo il browser viene reindirizzato al provider
    if (error) {
      setError(clientErrorMessage(error));
      setPending(null);
    }
  }

  const oidc = providers.oidc;

  return (
    <div className="space-y-2">
      <FormMessage kind="error">{error}</FormMessage>
      {providers.google && (
        <button type="button" className={secondaryButtonClass} disabled={!!pending} onClick={() => signInWith("google")}>
          <GoogleIcon />
          {pending === "google" ? texts.common.loading : texts.login.withGoogle}
        </button>
      )}
      {oidc && (
        <button type="button" className={secondaryButtonClass} disabled={!!pending} onClick={() => signInWith(oidc.id)}>
          {pending === oidc.id ? texts.common.loading : texts.login.withProvider(oidc.label)}
        </button>
      )}
    </div>
  );
}
