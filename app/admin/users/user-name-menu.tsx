"use client";

import { useState, useTransition } from "react";
import { NameMenu } from "@/components/auth/NameMenu";
import { deleteUser } from "./actions";

/** Nome di un utente in tabella: il menu ha la sola voce Elimina (con conferma). Il ruolo resta nel suo controllo in colonna. */
export default function UserNameMenu({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <NameMenu
      name={name}
      label={email}
      error={error}
      busy={isPending}
      items={[
        {
          kind: "delete",
          name: email,
          onConfirm: () =>
            startTransition(async () => {
              const r = await deleteUser(userId);
              setError(r.ok ? null : r.error);
            }),
        },
      ]}
    />
  );
}
