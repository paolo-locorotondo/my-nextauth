"use client";

import { useState, useTransition } from "react";
import { DeleteConfirm } from "@/components/auth/DeleteConfirm";
import { RowActions } from "@/components/auth/ui";
import { deleteUser } from "./actions";

export default function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const r = await deleteUser(userId);
      setError(r.ok ? null : r.error);
    });
  }

  return (
    <RowActions error={error}>
      <DeleteConfirm
        name={email}
        onConfirm={onConfirm}
        disabled={isPending}
        compact
        notice="Eliminare? Cancella anche i suoi account (email, Google, SSO), le sessioni e i token di reset. Non si può annullare."
      />
    </RowActions>
  );
}
