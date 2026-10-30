"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Notifica di esito positivo (aggiunto, aggiornato, eliminato) in sovraimpressione: in basso su telefono,
 * in alto a destra da `sm`. Sparisce da sola dopo qualche secondo e si chiude con la X.
 * Gli errori restano invece sotto la riga o il form (vedi `FormMessage`).
 */
const DURATION_MS = 8000;

type Item = { id: number; text: string };
type Notify = (text: string) => void;

const Context = createContext<Notify>(() => {});

/** Restituisce la funzione che mostra una notifica, es. `notify("Email mario@x.it aggiunta")`. */
export function useToast() {
  return useContext(Context);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const counter = useRef(0);

  const close = useCallback((id: number) => setItems((v) => v.filter((x) => x.id !== id)), []);
  const notify = useCallback<Notify>((text) => {
    const id = ++counter.current;
    setItems((v) => [...v.slice(-2), { id, text }]);
  }, []);

  return (
    <Context.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-16 sm:items-end sm:px-0 sm:pb-0"
      >
        {items.map((i) => (
          <ToastItem key={i.id} item={i} onClose={close} />
        ))}
      </div>
    </Context.Provider>
  );
}

function ToastItem({ item, onClose }: { item: Item; onClose: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(item.id), DURATION_MS);
    return () => clearTimeout(t);
  }, [item.id, onClose]);
  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 shadow-lg">
      <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.text}</p>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Chiudi la notifica"
        className="-mr-1 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-green-800 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
          <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
