"use client";

import { useState } from "react";
import { ActionButton, DeleteButton } from "@/components/auth/ui";

/**
 * Elimina in due passi, inline (anche su telefono, mai window.confirm): il primo clic chiede
 * conferma con "Sì, elimina" / "Annulla", il secondo esegue. `name` completa le etichette per gli screen reader.
 */
export function DeleteConfirm({
  name,
  onConfirm,
  disabled,
  compact = false,
  notice = "Eliminare? Non si può annullare.",
  text,
  verb = "Elimina",
}: {
  name: string;
  onConfirm: () => void;
  disabled?: boolean;
  compact?: boolean;
  /** frase della conferma, se serve dire cosa si perde */
  notice?: string;
  /** etichetta del primo tasto (default = verb) */
  text?: string;
  verb?: string;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <DeleteButton onClick={() => setAsking(true)} disabled={disabled} label={`${verb} ${name}`} compact={compact}>
        {text ?? verb}
      </DeleteButton>
    );
  }
  return (
    <span role="group" aria-label={`Conferma eliminazione di ${name}`} className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-red-900">{notice}</span>
      <DeleteButton
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        disabled={disabled}
        label={`Sì, ${verb.toLowerCase()} ${name}`}
        compact={compact}
      >
        Sì, {verb.toLowerCase()}
      </DeleteButton>
      <ActionButton onClick={() => setAsking(false)} disabled={disabled} compact={compact}>
        Annulla
      </ActionButton>
    </span>
  );
}
