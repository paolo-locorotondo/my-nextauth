"use client";

import { useState, useTransition } from "react";
import { NameMenu, type MenuItem } from "@/components/auth/NameMenu";
import { useToast } from "@/components/auth/Toast";
import { ActionButton, DeleteButton, FormMessage, RowActions } from "@/components/auth/ui";
import { ALLOWLIST_LIMITS } from "@/lib/auth/allowlist-rules";
import { addAllowedEmail, removeAllowedEmail, updateAllowedEmail } from "./actions";

type Entry = { id: string; pattern: string; note: string | null };

const fieldClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";
const submitClass = "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60";
const cancelClass = "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

export default function AllowedEmailsManager({ entries }: { entries: Entry[] }) {
  const notify = useToast();
  const [pattern, setPattern] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editPattern, setEditPattern] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await addAllowedEmail(pattern, note);
      if (r.ok) {
        notify(`Email ${pattern.trim()} aggiunta`);
        setPattern("");
        setNote("");
        setError(null);
      } else {
        setError(r.error);
      }
    });
  }

  function openEdit(e: Entry) {
    setEditError(null);
    setEditPattern(e.pattern);
    setEditNote(e.note ?? "");
    setEditing(e);
  }

  function onUpdate(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const r = await updateAllowedEmail(editing.id, editPattern, editNote);
      if (r.ok) {
        setEditing(null);
        notify(`Email ${editPattern.trim()} aggiornata`);
      } else {
        setEditError(r.error);
      }
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const r = await removeAllowedEmail(id);
      setRowError(r.ok ? null : { id, text: r.error });
      if (r.ok) notify(`Email ${entries.find((x) => x.id === id)?.pattern ?? ""} rimossa`);
    });
  }

  const items = (e: Entry): MenuItem[] => [
    { kind: "action", label: "Modifica", onSelect: () => openEdit(e) },
    { kind: "delete", name: e.pattern, onConfirm: () => onRemove(e.id) },
  ];
  const errorOf = (id: string) => (rowError?.id === id ? rowError.text : null);

  return (
    <div className="mt-6 space-y-4">
      <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="mario@x.it oppure @azienda.it"
          aria-label="Email o dominio"
          required
          maxLength={ALLOWLIST_LIMITS.pattern}
          autoComplete="off"
          className={`flex-1 ${fieldClass}`}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (facoltativa)"
          aria-label="Nota"
          maxLength={ALLOWLIST_LIMITS.note}
          autoComplete="off"
          className={`flex-1 ${fieldClass}`}
        />
        <button type="submit" disabled={isPending} className={submitClass}>
          Aggiungi
        </button>
      </form>

      {error && <FormMessage kind="error">{error}</FormMessage>}

      {editing && (
        <form key={editing.id} onSubmit={onUpdate} className="space-y-3 rounded-lg border border-blue-200 bg-white p-4">
          <h2 className="font-semibold">Modifica la voce</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={editPattern}
              onChange={(e) => setEditPattern(e.target.value)}
              aria-label="Email o dominio"
              required
              maxLength={ALLOWLIST_LIMITS.pattern}
              autoComplete="off"
              className={`flex-1 ${fieldClass}`}
            />
            <input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Nota (facoltativa)"
              aria-label="Nota"
              maxLength={ALLOWLIST_LIMITS.note}
              autoComplete="off"
              className={`flex-1 ${fieldClass}`}
            />
          </div>
          <p className="text-sm text-slate-500">
            Se cambi la voce, chi era ammesso solo da quella perde le sessioni aperte e dovrà rientrare con un&apos;email ammessa.
          </p>
          {editError && <FormMessage kind="error">{editError}</FormMessage>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isPending} className={submitClass}>
              {isPending ? "Salvataggio…" : "Salva modifiche"}
            </button>
            <button type="button" onClick={() => setEditing(null)} disabled={isPending} className={cancelClass}>
              Annulla
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna voce: con la white list attiva possono entrare solo gli admin di bootstrap.</p>
      ) : (
        <>
          {/* Schermi larghi: tabella, azioni nel menu sul nome */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Voce</th>
                  <th className="py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-mono break-all">
                      <NameMenu name={e.pattern} label={e.pattern} items={items(e)} error={errorOf(e.id)} busy={isPending} className="font-mono" />
                    </td>
                    <td className="py-2 break-words text-slate-500">{e.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Telefono: una scheda per voce, tasti visibili */}
          <ul className="space-y-3 md:hidden">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-mono font-medium break-all">{e.pattern}</p>
                {e.note && <p className="mt-1 break-words text-slate-500">{e.note}</p>}
                <div className="mt-3">
                  <RowActions error={errorOf(e.id)}>
                    <ActionButton onClick={() => openEdit(e)} disabled={isPending} label={`Modifica ${e.pattern}`}>
                      Modifica
                    </ActionButton>
                    <DeleteButton onClick={() => onRemove(e.id)} disabled={isPending} label={`Rimuovi ${e.pattern}`}>
                      Rimuovi
                    </DeleteButton>
                  </RowActions>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
