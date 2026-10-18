import AuthGate from "@/components/auth/AuthGate";
import SiteHeader from "@/components/demo/SiteHeader";
import { ADMIN_ROLES } from "@/lib/auth/config";
import { env } from "@/lib/auth/env";
import { prisma } from "@/lib/db";
import AllowedEmailsManager from "./allowed-emails-manager";

/** Demo: gestione della white list di email (solo ADMIN). */
export default function AllowedEmailsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <AuthGate callbackPath="/admin/allowed-emails" roles={ADMIN_ROLES}>
          {() => <AllowlistContent />}
        </AuthGate>
      </main>
    </>
  );
}

async function AllowlistContent() {
  const entries = await prisma.allowedEmail.findMany({ orderBy: { pattern: "asc" } });

  return (
    <div className="space-y-6">
      {!env.allowlistEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La white list <strong>non è attiva</strong>: imposta <code>AUTH_ALLOWLIST=on</code> e riavvia l&apos;app perché
          registrazione e login vengano limitati a queste voci.
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Email ammesse</h1>
        <p className="mt-1 text-sm text-slate-500">
          Voci esatte (<code>mario@x.it</code>) o interi domini (<code>@azienda.it</code>). Gli admin di bootstrap
          (<code>AUTH_ADMIN_EMAILS</code>) sono sempre ammessi.
        </p>
        <AllowedEmailsManager entries={entries.map((e) => ({ id: e.id, pattern: e.pattern, note: e.note }))} />
      </div>
    </div>
  );
}
