/** Campo di un form di autenticazione: etichetta, controllo, errore sotto il campo e contatore dei caratteri. */

/** Attributi del controllo (input) associato a un `Field`. */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

/** Porta il focus sul primo campo (nell'ordine del form) che ha un errore. */
export function focusFirstError(order: string[], errors: Record<string, string>) {
  const id = order.find((k) => errors[k]);
  if (id) document.getElementById(id)?.focus();
}

/** Contatore "n/max" con avviso vocale vicino al limite. */
export function CharCounter({ length, max }: { length: number; max: number }) {
  const full = length >= max;
  const near = length >= max * 0.9;
  return (
    <>
      <span aria-hidden className={`mt-1 shrink-0 text-xs tabular-nums ${full ? "font-semibold text-red-700" : near ? "text-amber-700" : "text-slate-500"}`}>
        {length}/{max}
      </span>
      <span aria-live="polite" className="sr-only">
        {full ? "Limite raggiunto" : near ? "Vicino al limite" : ""}
      </span>
    </>
  );
}

export default function Field({
  id,
  label,
  error,
  max,
  value,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Limite di caratteri: mostra il contatore sotto a destra (serve anche `value`). */
  max?: number;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {(error || max !== undefined) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {error && (
              <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
          {max !== undefined && <CharCounter length={value?.length ?? 0} max={max} />}
        </div>
      )}
    </div>
  );
}
