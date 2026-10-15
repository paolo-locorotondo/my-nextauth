import { AuthCard, FormMessage } from "@/components/auth/ui";
import { safeCallbackUrl } from "@/lib/auth/safe-redirect";
import { texts } from "@/lib/auth/texts";
import ResendVerification from "./resend-verification";

/**
 * Due casi: dopo la registrazione (?email=...) e link di verifica non valido
 * o scaduto (?error=INVALID_TOKEN, via /auth/continue). In entrambi si può
 * richiedere un nuovo link.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/auth/verify-email">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : null;
  const error = typeof params.error === "string" ? params.error : null;
  const callbackUrl = safeCallbackUrl(typeof params.callbackUrl === "string" ? params.callbackUrl : null);

  return (
    <AuthCard title={texts.verifyEmail.title}>
      {error ? (
        <FormMessage kind="error">{texts.verifyEmail.invalidToken}</FormMessage>
      ) : (
        <FormMessage kind="info">{texts.verifyEmail.checkInbox(email)}</FormMessage>
      )}
      <ResendVerification initialEmail={email ?? ""} callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
