import { Children } from "react";

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

export function FormMessage({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  // Children.toArray scarta null/false/undefined: `{error}{unverified && ...}` è un array
  // di due elementi vuoti, quindi `!children` da solo non basta e comparirebbe un riquadro vuoto.
  if (Children.toArray(children).length === 0) return null;
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
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
