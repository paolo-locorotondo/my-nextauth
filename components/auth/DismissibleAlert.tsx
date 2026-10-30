"use client";

import { useState } from "react";

/** Riquadro rosso di un errore: resta finché non lo si chiude con la X in alto a destra. */
export function DismissibleAlert({ children }: { children: React.ReactNode }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">{children}</div>
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Chiudi l'errore"
        className="-mr-1 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
          <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
