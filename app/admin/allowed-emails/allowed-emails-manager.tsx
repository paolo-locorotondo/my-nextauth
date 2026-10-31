"use client";

import { useState, useTransition } from "react";
import { NameMenu, type MenuItem } from "@/components/auth/NameMenu";
import { useToast } from "@/components/auth/Toast";
import { DeleteConfirm } from "@/components/auth/DeleteConfirm";
import { CharCounter } from "@/components/auth/Field";
import { ActionButton, RowActions } from "@/components/auth/ui";
import { ALLOWLIST_LIMITS } from "@/lib/auth/allowlist-rules";
import { addAllowedEmail, removeAllowedEmail, updateAllowedEmail } from "./actions";

type Entry = { id: string; pattern: string; note: string | null };

const fieldClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm aria-[invalid=true]:border-red-500";
const PATTERN_ERROR = "Inserisci un'email o un dominio (es. @azienda.it)";
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
    if (!pattern.trim()) {
      setError(PATTERN_ERROR);
      document.getElementById("ae-pattern")?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await addAllowedEmail(pattern, note);
      if (r.ok) {
        notify(`Email ${pattern.trim()} aggiunta`);
        setPattern("");
        setNote("");
        setError(null);
      } else {
        setError(r.error);
        document.getElementById("ae-pattern")?.focus();
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
    if (!editPattern.trim()) {
      setEditError(PATTERN_ERROR);
      document.getElementById("ae-edit-pattern")?.focus();
      return;
    }
    setEditError(null);
    startTransition(async () => {
      const r = await updateAllowedEmail(editing.id, editPattern, editNote);
      if (r.ok) {
        setEditing(null);
        notify(`Email ${editPattern.trim()} aggiornata`);
      } else {
        setEditError(r.error);
        document.getElementById("ae-edit-pattern")?.focus();
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
      <form onSubmit={onAdd} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <input
            id="ae-pattern"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setError(null);
            }}
            placeholder="mario@x.it oppure @azienda.it"
            aria-label="Email o dominio"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "ae-pattern-error" : undefined}
            required
            maxLength={ALLOWLIST_LIMITS.pattern}
            autoComplete="off"
            className={fieldClass}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">{error && <p id="ae-pattern-error" role="alert" className="mt-1 text-sm text-red-700">{error}</p>}</div>
            <CharCounter length={pattern.length} max={ALLOWLIST_LIMITS.pattern} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <input
            id="ae-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (facoltativa)"
            aria-label="Nota"
            maxLength={ALLOWLIST_LIMITS.note}
            autoComplete="off"
            className={fieldClass}
          />
          <div className="flex justify-end">
            <CharCounter length={note.length} max={ALLOWLIST_LIMITS.note} />
          </div>
        </div>
        <button type="submit" disabled={isPending} className={submitClass}>
          Aggiungi
        </button>
      </form>

      {editing && (
        <form key={editing.id} onSubmit={onUpdate} noValidate className="space-y-3 rounded-lg border border-blue-200 bg-white p-4">
          <h2 className="font-semibold">Modifica la voce</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <input
                id="ae-edit-pattern"
                value={editPattern}
                onChange={(e) => {
                  setEditPattern(e.target.value);
                  setEditError(null);
                }}
                aria-label="Email o dominio"
                aria-invalid={editError ? true : undefined}
                aria-describedby={editError ? "ae-edit-pattern-error" : undefined}
                required
                maxLength={ALLOWLIST_LIMITS.pattern}
                autoComplete="off"
                className={fieldClass}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">{editError && <p id="ae-edit-pattern-error" role="alert" className="mt-1 text-sm text-red-700">{editError}</p>}</div>
                <CharCounter length={editPattern.length} max={ALLOWLIST_LIMITS.pattern} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <input
                id="ae-edit-note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Nota (facoltativa)"
                aria-label="Nota"
                maxLength={ALLOWLIST_LIMITS.note}
                autoComplete="off"
                className={fieldClass}
              />
              <div className="flex justify-end">
                <CharCounter length={editNote.length} max={ALLOWLIST_LIMITS.note} />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Se cambi la voce, chi era ammesso solo da quella perde le sessioni aperte e dovrà rientrare con un&apos;email ammessa.
          </p>
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
                    <DeleteConfirm
                      name={e.pattern}
                      onConfirm={() => onRemove(e.id)}
                      disabled={isPending}
                      verb="Rimuovi"
                      notice="Rimuovere? Chi entrava solo grazie a questa voce perde le sessioni."
                    />
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
