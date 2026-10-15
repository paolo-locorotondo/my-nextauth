"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { texts } from "@/lib/auth/texts";

export default function SignOutButton({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    // Navigazione completa: azzera la cache del router e ri-renderizza i server component
    window.location.assign(AUTH_ROUTES.home);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={className ?? "text-sm font-medium text-slate-600 hover:text-slate-900"}
    >
      {pending ? texts.common.loading : texts.userMenu.signOut}
    </button>
  );
}
