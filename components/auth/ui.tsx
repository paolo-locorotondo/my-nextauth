import { Children } from "react";
import { DismissibleAlert } from "./DismissibleAlert";

/** Classi e piccoli componenti condivisi dalle pagine di autenticazione. */

// text-base (16px) negli input: sotto questa soglia Safari su iPhone zooma da solo al focus.
// min-h-11 (44px) sui pulsanti: dimensione minima consigliata per il tocco.
export const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
export const labelClass = "block text-sm font-medium text-slate-700";
export const primaryButtonClass =
  "min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButtonClass =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
export const linkClass = "font-medium text-blue-600 hover:underline";
/** Select dei form a larghezza piena: come inputClass, con la freccia personalizzata (.select-custom in globals.css). */
export const selectClass = `${inputClass} select-custom`;
/** Select dentro tabelle e card: compatto, stessa famiglia visiva. */
export const selectTabellaClass =
  "select-custom min-h-9 rounded border border-slate-300 bg-white py-1 pl-2.5 text-sm text-slate-900 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:bg-slate-100 disabled:opacity-60";

/** Pulsante Elimina/Rimuovi unico per tutta l'app: compatto in tabella, con tocco comodo nelle card. */
export function DeleteButton({
  onClick,
  disabled,
  children = "Elimina",
  label,
  compact = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  /** aria-label quando il testo da solo non dice cosa si elimina */
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded border border-red-200 bg-white px-3 font-sans text-sm font-medium text-red-700 hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "min-h-8" : "min-h-11"}`}
    >
      {children}
    </button>
  );
}

/** Pulsante di azione di riga o scheda (esegue qualcosa): stesso aspetto del DeleteButton, senza il rosso. */
export function ActionButton({
  onClick,
  disabled,
  children,
  label,
  compact = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded border border-slate-300 bg-white px-3 font-sans text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "min-h-8" : "min-h-11"}`}
    >
      {children}
    </button>
  );
}

/**
 * Contenitore delle azioni di una riga o scheda: i tasti in fila e, SOTTO i tasti, l'errore dell'azione.
 * L'errore di una riga non va mai in un altro blocco della pagina.
 */
export function RowActions({ error, align = "start", children }: { error?: string | null; align?: "start" | "end"; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${align === "end" ? "items-end" : "items-start"}`}>
      <div className={`flex flex-wrap items-center gap-2 ${align === "end" ? "justify-end" : ""}`}>{children}</div>
      {error && (
        <div className="max-w-xs text-left">
          <FormMessage kind="error">{error}</FormMessage>
        </div>
      )}
    </div>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  // Children.toArray scarta null/false/undefined: `{error}{unverified && ...}` è un array
  // di due elementi vuoti, quindi `!children` da solo non basta e comparirebbe un riquadro vuoto.
  if (Children.toArray(children).length === 0) return null;
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  }[kind];
  // Gli errori si chiudono con la X; `key` riparte da zero quando cambia il testo
  if (kind === "error") return <DismissibleAlert key={typeof children === "string" ? children : undefined}>{children}</DismissibleAlert>;
  return (
    <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-5 space-y-4 sm:mt-6">{children}</div>
    </div>
  );
}
