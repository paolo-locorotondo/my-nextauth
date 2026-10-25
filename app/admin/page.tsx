import Link from "next/link";
import AuthGate from "@/components/auth/AuthGate";
import SiteHeader from "@/components/demo/SiteHeader";
import { ADMIN_ROLES, ROLES } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import DeleteUserButton from "./delete-user-button";
import RoleSelect from "./role-select";

/** Demo: elenco utenti, cambio ruolo ed eliminazione (solo ADMIN). */
export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <AuthGate callbackPath="/admin" roles={ADMIN_ROLES}>
          {(me) => <UsersTable meId={me.id} />}
        </AuthGate>
      </main>
    </>
  );
}

async function UsersTable({ meId }: { meId: string }) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, emailVerified: true, role: true, accounts: { select: { providerId: true } } },
  });

  const actions = (u: (typeof users)[number]) =>
    u.id === meId ? (
      <span className="text-sm text-slate-400">(tu)</span>
    ) : (
      <DeleteUserButton userId={u.id} email={u.email} />
    );

  const role = (u: (typeof users)[number]) =>
    u.id === meId ? (
      <span className="font-medium">{u.role}</span>
    ) : (
      <RoleSelect userId={u.id} role={u.role} roles={ROLES} />
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">Utenti</h1>
        <Link href="/admin/allowed-emails" className="text-sm font-medium text-blue-600 hover:underline">
          Email ammesse →
        </Link>
      </div>

      {/* Schermi larghi: tabella */}
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Nome</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Verificata</th>
              <th className="py-2 pr-4 font-medium">Accesso</th>
              <th className="py-2 pr-4 font-medium">Ruolo</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4 break-all">{u.email}</td>
                <td className="py-2 pr-4">{u.emailVerified ? "sì" : "no"}</td>
                <td className="py-2 pr-4 text-slate-500">{u.accounts.map((a) => a.providerId).join(", ")}</td>
                <td className="py-2 pr-4">{role(u)}</td>
                <td className="py-2 text-right">{actions(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Telefono: una scheda per utente, senza scroll orizzontale */}
      <ul className="mt-4 space-y-3 md:hidden">
        {users.map((u) => (
          <li key={u.id} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium">{u.name}</p>
            <p className="break-all text-slate-600">{u.email}</p>
            <p className="mt-1 text-xs text-slate-500">
              Email {u.emailVerified ? "verificata" : "non verificata"} · {u.accounts.map((a) => a.providerId).join(", ") || "nessun account"}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {role(u)}
              {actions(u)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
