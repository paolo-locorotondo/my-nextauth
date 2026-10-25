"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "./actions";

export default function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const ok = window.confirm(
      `Eliminare ${email}?\n\nVengono cancellati anche i suoi account (email, Google, SSO), le sessioni aperte e i token di reset pendenti. L'operazione non è reversibile.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteUser(userId);
      setError(r.ok ? null : r.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded-md border border-red-200 px-2.5 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Elimino…" : "Elimina"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
