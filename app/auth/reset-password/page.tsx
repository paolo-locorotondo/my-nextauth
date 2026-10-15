import Link from "next/link";
import { AuthCard, FormMessage, linkClass } from "@/components/auth/ui";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { texts } from "@/lib/auth/texts";
import ResetPasswordForm from "./reset-password-form";

/**
 * Destinazione del link email: Better Auth (GET /api/auth/reset-password/:token)
 * reindirizza qui con ?token=... oppure ?error=INVALID_TOKEN.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/auth/reset-password">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  if (!token || params.error) {
    return (
      <AuthCard title={texts.resetPassword.title}>
        <FormMessage kind="error">{texts.resetPassword.invalidToken}</FormMessage>
        <p className="text-center text-sm">
          <Link href={AUTH_ROUTES.forgotPassword} className={linkClass}>
            {texts.resetPassword.requestNew}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return <ResetPasswordForm token={token} />;
}
