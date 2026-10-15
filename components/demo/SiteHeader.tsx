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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
