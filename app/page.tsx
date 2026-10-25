import Link from "next/link";
import SiteHeader from "@/components/demo/SiteHeader";
import { AUTH_ROUTES, landingForRole } from "@/lib/auth/config";
import { getOptionalSession } from "@/lib/auth/helpers";

/** Home PUBBLICA: accessibile senza login. */
export default async function Home() {
  const session = await getOptionalSession();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">my-nextauth</h1>
        <p className="mt-4 text-slate-600">
          Template di autenticazione per Next.js 16 con Better Auth: email e password, verifica email, reset password,
          Google e OIDC, ruoli.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {session ? (
            <Link
              href={landingForRole(session.user.role)}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Vai all&apos;area riservata
            </Link>
          ) : (
            <>
              <Link href={AUTH_ROUTES.login} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
                Accedi
              </Link>
              <Link
                href={AUTH_ROUTES.register}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Registrati
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  );
}
