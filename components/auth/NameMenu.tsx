"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ActionButton, DeleteButton, RowActions } from "@/components/auth/ui";

/**
 * Menu contestuale sul nome di una riga di tabella (da `md` in su; sul telefono le card hanno i tasti visibili).
 * Le voci sono quelle delle azioni di riga: "naviga" (Vai al dettaglio, Modifica), "esegue" (Dismetti, Avvia…)
 * ed "elimina" (con conferma dentro il menu). L'errore di un'azione compare sotto il nome della riga.
 */
export type MenuItem =
  | { kind: "link"; label: string; href: string }
  | { kind: "action"; label: string; onSelect: () => void; disabled?: boolean }
  | { kind: "delete"; name: string; onConfirm: () => void; disabled?: boolean };

const ALTEZZA_STIMATA = 220;
const voceClass =
  "flex min-h-9 w-full items-center px-3 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60";

export function NameMenu({
  name,
  label,
  items,
  error,
  busy = false,
  className = "",
}: {
  /** testo mostrato (può includere elementi, es. la superficie tra parentesi) */
  name: React.ReactNode;
  /** nome in chiaro della riga, per le etichette dei lettori di schermo */
  label: string;
  items: MenuItem[];
  error?: string | null;
  busy?: boolean;
  className?: string;
}) {
  const id = useId();
  const [aperto, setAperto] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const bottone = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const chiudi = useCallback((rifocalizza = true) => {
    setAperto(false);
    setConfirm(null);
    if (rifocalizza) bottone.current?.focus();
  }, []);

  function apri() {
    const r = bottone.current!.getBoundingClientRect();
    const sopra = r.bottom + ALTEZZA_STIMATA > window.innerHeight && r.top > ALTEZZA_STIMATA;
    setPos(sopra ? { bottom: window.innerHeight - r.top + 4, left: r.left } : { top: r.bottom + 4, left: r.left });
    setAperto(true);
  }

  // Il menu è `fixed` sotto il nome: se esce dallo schermo a destra (telefono) lo si sposta a sinistra.
  useLayoutEffect(() => {
    if (!aperto || !menu.current) return;
    const larghezza = menu.current.offsetWidth;
    const sinistra = Math.max(8, Math.min(pos.left, window.innerWidth - larghezza - 8));
    if (sinistra !== pos.left) setPos((p) => ({ ...p, left: sinistra }));
  }, [aperto, confirm, pos.left]);

  // Chiude con un clic fuori, con lo scorrimento o il ridimensionamento (il menu è `fixed`).
  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !bottone.current?.contains(t)) chiudi(false);
    };
    const via = () => chiudi(false);
    document.addEventListener("pointerdown", fuori);
    window.addEventListener("scroll", via, true);
    window.addEventListener("resize", via);
    return () => {
      document.removeEventListener("pointerdown", fuori);
      window.removeEventListener("scroll", via, true);
      window.removeEventListener("resize", via);
    };
  }, [aperto, chiudi]);

  // All'apertura il focus va alla prima voce.
  useEffect(() => {
    // preventScroll: uno scorrimento chiuderebbe subito il menu (che è `fixed`)
    if (aperto && !confirm) menu.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus({ preventScroll: true });
    if (aperto && confirm) menu.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [aperto, confirm]);

  function tastiera(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      chiudi();
      return;
    }
    if (e.key === "Tab") {
      chiudi(false);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled), button:not(:disabled)') ?? []);
    if (items.length === 0) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const prossimo = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[prossimo].focus();
  }

  return (
    <RowActions error={error}>
      <button
        ref={bottone}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aperto}
        aria-controls={aperto ? id : undefined}
        aria-label={`Azioni per ${label}`}
        disabled={busy}
        onClick={() => (aperto ? chiudi(false) : apri())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !aperto) {
            e.preventDefault();
            apri();
          }
        }}
        className={`inline-flex items-center gap-1 rounded text-left font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:opacity-60 ${className}`}
      >
        <span className="[overflow-wrap:anywhere]">{busy ? "Salvataggio…" : name}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${aperto ? "rotate-180" : ""}`}>
          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {aperto && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={`Azioni per ${label}`}
          onKeyDown={tastiera}
          style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left }}
          className="z-30 min-w-44 max-w-[calc(100vw-1rem)] rounded sm:max-w-xs border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {confirm ? (
            <div role="group" aria-label={`Conferma eliminazione di ${confirm}`} className="space-y-2 p-3">
              <p className="text-red-900">Eliminare? Non si può annullare.</p>
              <div className="flex flex-wrap gap-2">
                {items.map((v) =>
                  v.kind === "delete" && v.name === confirm ? (
                    <DeleteButton
                      key="si"
                      compact
                      label={`Sì, elimina ${v.name}`}
                      onClick={() => {
                        chiudi(false);
                        v.onConfirm();
                      }}
                      disabled={v.disabled}
                    >
                      Sì, elimina
                    </DeleteButton>
                  ) : null,
                )}
                <ActionButton compact onClick={() => chiudi()}>
                  Annulla
                </ActionButton>
              </div>
            </div>
          ) : (
            items.map((v) =>
              v.kind === "link" ? (
                <Link key={v.label} role="menuitem" href={v.href} onClick={() => chiudi(false)} className={voceClass}>
                  {v.label}
                </Link>
              ) : v.kind === "action" ? (
                <button
                  key={v.label}
                  type="button"
                  role="menuitem"
                  disabled={v.disabled}
                  onClick={() => {
                    chiudi(false);
                    v.onSelect();
                  }}
                  className={voceClass}
                >
                  {v.label}
                </button>
              ) : (
                <button key="elimina" type="button" role="menuitem" disabled={v.disabled} onClick={() => setConfirm(v.name)} className={`${voceClass} text-red-700 hover:bg-red-50 focus-visible:bg-red-50`}>
                  Elimina
                </button>
              ),
            )
          )}
        </div>
      )}
    </RowActions>
  );
}
