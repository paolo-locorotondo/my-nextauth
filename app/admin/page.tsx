import Link from "next/link";
import AuthGate from "@/components/auth/AuthGate";
import SiteHeader from "@/components/demo/SiteHeader";
import { ADMIN_ROLES, ROLES } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import RoleSelect from "./role-select";

/** Demo: elenco utenti e cambio ruolo (solo ADMIN). */
export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Utenti</h1>
        <Link href="/admin/allowed-emails" className="text-sm font-medium text-blue-600 hover:underline">
          Email ammesse →
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Nome</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Verificata</th>
              <th className="py-2 pr-4 font-medium">Accesso</th>
              <th className="py-2 font-medium">Ruolo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.emailVerified ? "sì" : "no"}</td>
                <td className="py-2 pr-4 text-slate-500">{u.accounts.map((a) => a.providerId).join(", ")}</td>
                <td className="py-2">
                  {u.id === meId ? (
                    <span className="font-medium">{u.role}</span>
                  ) : (
                    <RoleSelect userId={u.id} role={u.role} roles={ROLES} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
