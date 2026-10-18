"use client";

import { useState, useTransition } from "react";
import { addAllowedEmail, removeAllowedEmail } from "./actions";

type Entry = { id: string; pattern: string; note: string | null };

export default function AllowedEmailsManager({ entries }: { entries: Entry[] }) {
  const [pattern, setPattern] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await addAllowedEmail(pattern, note);
      if (r.ok) {
        setPattern("");
        setNote("");
        setError(null);
      } else {
        setError(r.error);
      }
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const r = await removeAllowedEmail(id);
      setError(r.ok ? null : r.error);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="mario@x.it oppure @azienda.it"
          required
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (facoltativa)"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Aggiungi
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna voce: con la white list attiva possono entrare solo gli admin di bootstrap.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Voce</th>
              <th className="py-2 pr-4 font-medium">Nota</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-mono">{e.pattern}</td>
                <td className="py-2 pr-4 text-slate-500">{e.note ?? ""}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    disabled={isPending}
                    className="text-sm text-red-600 hover:underline disabled:opacity-60"
                  >
                    Rimuovi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
