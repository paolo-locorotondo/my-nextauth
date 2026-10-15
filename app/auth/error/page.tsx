import Link from "next/link";
import { AuthCard, FormMessage, primaryButtonClass } from "@/components/auth/ui";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { authErrorMessage } from "@/lib/auth/errors";
import { texts } from "@/lib/auth/texts";

/** Errori dei redirect di Better Auth (OAuth/OIDC, onAPIError.errorURL) e di /auth/continue. */
export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const params = await searchParams;
  const code = typeof params.error === "string" ? params.error : null;

  return (
    <AuthCard title={texts.error.title}>
      <FormMessage kind="error">{authErrorMessage(code)}</FormMessage>
      {code && <p className="text-xs text-slate-400">Codice: {code}</p>}
      <Link href={AUTH_ROUTES.login} className={`${primaryButtonClass} block text-center`}>
        {texts.error.retry}
      </Link>
    </AuthCard>
  );
}
