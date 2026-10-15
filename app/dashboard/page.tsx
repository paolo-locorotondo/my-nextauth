import AuthGate from "@/components/auth/AuthGate";
import SiteHeader from "@/components/demo/SiteHeader";

/** Demo: pagina per tutti gli utenti approvati (i ruoli pending vedono PendingApproval). */
export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <AuthGate callbackPath="/dashboard">
          {(user) => (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Benvenuto {user.name}. Sei loggato come <strong>{user.email}</strong> con ruolo <strong>{user.role}</strong>.
              </p>
              <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
                <li>
                  <a href="/api/demo/me" className="text-blue-600 hover:underline">
                    /api/demo/me
                  </a>{" "}
                  — sessione corrente in JSON
                </li>
                <li>
                  <a href="/api/demo/admin" className="text-blue-600 hover:underline">
                    /api/demo/admin
                  </a>{" "}
                  — 403 se non sei ADMIN
                </li>
              </ul>
            </div>
          )}
        </AuthGate>
      </main>
    </>
  );
}
