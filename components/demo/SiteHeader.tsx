import Link from "next/link";
import MenuSezioni, { NavDesktop, type Voce } from "@/components/demo/MenuSezioni";
import UserMenu from "@/components/auth/UserMenu";
import { getOptionalSession } from "@/lib/auth/helpers";
import { isAdmin } from "@/lib/auth/roles";

/** Header della demo (non core): sostituiscilo con quello del progetto. Sezioni in linea da desktop, hamburger su telefono. */
export default async function SiteHeader() {
  const session = await getOptionalSession();
  const user = session?.user;

  const voci: Voce[] = [
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(isAdmin(user)
      ? [
          {
            href: "/admin",
            label: "Admin",
            figli: [
              { href: "/admin/users", label: "Utenti" },
              { href: "/admin/allowed-emails", label: "Email ammesse" },
            ],
          },
        ]
      : []),
  ];

  return (
    <header className="relative border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          {/* Su telefono l'hamburger sta prima del marchio; il pannello si ancora all'header */}
          {voci.length > 0 && <MenuSezioni voci={voci} />}
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900">
            <span aria-hidden className="inline-block h-5 w-5 rounded-sm bg-blue-600" />
            {/* Su telefono resta solo il logo: il nome si accavallerebbe al menu utente */}
            <span className="sr-only sm:not-sr-only">my-nextauth</span>
          </Link>
          <NavDesktop voci={voci} />
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
