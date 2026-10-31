"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "@/components/auth/PasswordInput";
import ProviderButtons, { type ProviderButtonsProps } from "@/components/auth/ProviderButtons";
import Field, { fieldProps, focusFirstError } from "@/components/auth/Field";
import { AuthCard, FormMessage, inputClass, linkClass, primaryButtonClass } from "@/components/auth/ui";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES, FIELD_LIMITS } from "@/lib/auth/config";
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clear = (k: string) => setFieldErrors((f) => (f[k] ? { ...f, [k]: "" } : f));

  function validate(): Record<string, string> {
    const f: Record<string, string> = {};
    if (!name.trim()) f.name = texts.validation.name;
    if (!emailSchema.safeParse(email).success) f.email = texts.validation.email;
    const pwd = passwordError(password);
    if (pwd) f.password = pwd;
    if (!pwd && password !== confirm) f.confirm = texts.register.passwordMismatch;
    return f;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validate();
    setFieldErrors(invalid);
    setError(null);
    if (Object.keys(invalid).length > 0) {
      focusFirstError(["name", "email", "password", "confirm"], invalid);
      return;
    }
    setPending(true);

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

        <Field id="name" label={texts.common.name} error={fieldErrors.name} max={FIELD_LIMITS.name} value={name}>
          <input
            {...fieldProps("name", fieldErrors.name)}
            autoComplete="name"
            required
            maxLength={FIELD_LIMITS.name}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clear("name");
            }}
            className={inputClass}
          />
        </Field>

        <Field id="email" label={texts.common.email} error={fieldErrors.email} max={FIELD_LIMITS.email} value={email}>
          <input
            {...fieldProps("email", fieldErrors.email)}
            type="email"
            autoComplete="email"
            required
            maxLength={FIELD_LIMITS.email}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clear("email");
            }}
            className={inputClass}
          />
        </Field>

        <Field id="password" label={texts.common.password} error={fieldErrors.password}>
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
