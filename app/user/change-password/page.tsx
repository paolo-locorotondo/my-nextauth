import Link from "next/link";
import { headers } from "next/headers";
import AuthGate from "@/components/auth/AuthGate";
import { AuthCard, FormMessage, linkClass } from "@/components/auth/ui";
import SiteHeader from "@/components/demo/SiteHeader";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { auth } from "@/lib/auth/server";
import { texts } from "@/lib/auth/texts";
import ChangePasswordForm from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex justify-center px-4 py-8 sm:py-12">
        {/* allowPending: anche un utente in attesa di approvazione può cambiare password */}
        <AuthGate callbackPath={AUTH_ROUTES.changePassword} allowPending>
          {() => <ChangePasswordContent />}
        </AuthGate>
      </main>
    </>
  );
}

async function ChangePasswordContent() {
  const accounts = await auth.api.listUserAccounts({ headers: await headers() });
  const hasPassword = accounts.some((a) => a.providerId === "credential");

  if (!hasPassword) {
    // Utente solo Google/OIDC: il reset via email crea l'account "credential"
    return (
      <AuthCard title={texts.changePassword.title}>
        <FormMessage kind="info">{texts.changePassword.noCredential}</FormMessage>
        <p className="text-center text-sm">
          <Link href={AUTH_ROUTES.forgotPassword} className={linkClass}>
            {texts.changePassword.setPassword}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return <ChangePasswordForm />;
}
