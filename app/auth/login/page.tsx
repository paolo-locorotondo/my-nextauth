import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/helpers";
import { providers } from "@/lib/auth/env";
import { continueUrl, safeCallbackUrl } from "@/lib/auth/safe-redirect";
import LoginForm from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(typeof params.callbackUrl === "string" ? params.callbackUrl : null);

  // Già loggato: niente form, si va direttamente a destinazione
  if (await getOptionalSession()) redirect(continueUrl(callbackUrl));

  return <LoginForm providers={providers} callbackUrl={callbackUrl} notice={typeof params.notice === "string" ? params.notice : null} />;
}
