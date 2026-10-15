import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/helpers";
import { providers } from "@/lib/auth/env";
import { continueUrl, safeCallbackUrl } from "@/lib/auth/safe-redirect";
import RegisterForm from "./register-form";

export default async function RegisterPage({ searchParams }: PageProps<"/auth/register">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(typeof params.callbackUrl === "string" ? params.callbackUrl : null);

  if (await getOptionalSession()) redirect(continueUrl(callbackUrl));

  return <RegisterForm providers={providers} callbackUrl={callbackUrl} />;
}
