import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";
import { getOptionalSession } from "@/lib/auth/helpers";
import { isAdmin } from "@/lib/auth/roles";

/** Header della demo (non core): sostituiscilo con quello del progetto. */
export default async function SiteHeader() {
  const session = await getOptionalSession();
  const user = session?.user;

  return (
    <header className="border-b border-slate-200 bg-white">
      {/* Su telefono logo+link e menu utente stanno su due righe; da sm in su su una sola */}
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold text-slate-900">
            my-nextauth
          </Link>
          {user && (
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          )}
          {isAdmin(user) && (
            <Link href="/admin" className="text-slate-600 hover:text-slate-900">
              Admin
            </Link>
          )}
        </nav>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
