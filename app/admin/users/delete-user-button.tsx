"use client";

import { useState, useTransition } from "react";
import { DeleteButton, RowActions } from "@/components/auth/ui";
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
    <RowActions error={error}>
      <DeleteButton onClick={onClick} disabled={isPending} label={`Elimina ${email}`} compact>
        {isPending ? "Elimino…" : "Elimina"}
      </DeleteButton>
    </RowActions>
  );
}
