"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import ProviderButtons, { type ProviderButtonsProps } from "@/components/auth/ProviderButtons";
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { clientErrorMessage } from "@/lib/auth/errors";
import { emailSchema, passwordError } from "@/lib/auth/password-policy";
import { continueUrl } from "@/lib/auth/safe-redirect";
import { texts } from "@/lib/auth/texts";

export default function RegisterForm({ providers, callbackUrl }: ProviderButtonsProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return texts.validation.name;
    if (!emailSchema.safeParse(email).success) return texts.validation.email;
    const pwd = passwordError(password);
    if (pwd) return pwd;
    if (password !== confirm) return texts.register.passwordMismatch;
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
      // Destinazione del link di verifica (auto sign-in, poi smistamento)
      callbackURL: continueUrl(callbackUrl),
    });

    if (error) {
      setError(clientErrorMessage(error));
      setPending(false);
      return;
    }
    router.push(`${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(email)}`);
  }

  const loginHref = callbackUrl ? `${AUTH_ROUTES.login}?callbackUrl=${encodeURIComponent(callbackUrl)}` : AUTH_ROUTES.login;

  return (
    <AuthCard title={texts.register.title}>
      <ProviderButtons providers={providers} callbackUrl={callbackUrl} />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormMessage kind="error">{error}</FormMessage>

        <div>
          <label htmlFor="name" className={labelClass}>
            {texts.common.name}
          </label>
          <input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

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
          <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>
            {texts.register.confirmPassword}
          </label>
          <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? texts.common.loading : texts.register.submit}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        {texts.register.haveAccount}{" "}
        <Link href={loginHref} className={linkClass}>
          {texts.register.login}
        </Link>
      </p>
    </AuthCard>
  );
}
