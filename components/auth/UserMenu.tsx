import Link from "next/link";
import { AUTH_ROUTES } from "@/lib/auth/config";
import type { SessionUser } from "@/lib/auth/server";
import { texts } from "@/lib/auth/texts";
import SignOutButton from "./SignOutButton";

/** Menu utente (server component): link di accesso se anonimo, saluto + azioni se loggato. */
export default function UserMenu({ user }: { user: SessionUser | null | undefined }) {
  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href={AUTH_ROUTES.login} className="font-medium text-slate-700 hover:text-slate-900">
          {texts.userMenu.signIn}
        </Link>
        <Link href={AUTH_ROUTES.register} className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700">
          {texts.userMenu.signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-slate-600">
        {texts.userMenu.greeting(user.name || user.email)}{" "}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">{user.role}</span>
      </span>
      <Link href={AUTH_ROUTES.changePassword} className="font-medium text-slate-600 hover:text-slate-900">
        {texts.userMenu.changePassword}
      </Link>
      <SignOutButton />
    </div>
  );
}
