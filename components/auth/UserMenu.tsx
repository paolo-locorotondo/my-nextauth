"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AUTH_ROUTES } from "@/lib/auth/config";
import type { SessionUser } from "@/lib/auth/server";
import { texts } from "@/lib/auth/texts";
import SignOutButton from "./SignOutButton";

/**
 * Menu utente: se anonimo mostra Accedi/Registrati; se loggato un solo pulsante con il nome
 * che apre a tendina saluto, ruolo, cambio password e uscita.
 * Chiude con Esc e con il clic fuori; il focus torna al pulsante.
 */
export default function UserMenu({ user }: { user: SessionUser | null | undefined }) {
  const [aperto, setAperto] = useState(false);
  const contenitore = useRef<HTMLDivElement>(null);
  const pulsante = useRef<HTMLButtonElement>(null);
  const idMenu = useId();

  useEffect(() => {
    if (!aperto) return;
    function fuori(e: MouseEvent) {
      if (!contenitore.current?.contains(e.target as Node)) setAperto(false);
    }
    function tasto(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAperto(false);
        pulsante.current?.focus();
      }
    }
    document.addEventListener("mousedown", fuori);
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("mousedown", fuori);
      document.removeEventListener("keydown", tasto);
    };
  }, [aperto]);

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href={AUTH_ROUTES.login} className="rounded px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
          {texts.userMenu.signIn}
        </Link>
        <Link href={AUTH_ROUTES.register} className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700">
          {texts.userMenu.signUp}
        </Link>
      </div>
    );
  }

  const nome = user.name || user.email;

  return (
    <div ref={contenitore} className="relative">
      <button
        ref={pulsante}
        type="button"
        aria-expanded={aperto}
        aria-controls={idMenu}
        aria-haspopup="menu"
        onClick={() => setAperto((v) => !v)}
        className="inline-flex min-h-9 max-w-full items-center gap-2 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
          {nome.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{nome}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 transition-transform ${aperto ? "rotate-180" : ""}`}>
          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aperto && (
        <div
          id={idMenu}
          role="menu"
          aria-label="Menu utente"
          className="absolute right-0 z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded border border-slate-200 bg-white py-1 text-sm shadow-md"
        >
          <p className="px-3 py-2 text-slate-600">
            {texts.userMenu.greeting(nome)} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">{user.role}</span>
          </p>
          <div className="border-t border-slate-100" />
          <Link
            href={AUTH_ROUTES.changePassword}
            role="menuitem"
            onClick={() => setAperto(false)}
            className="block px-3 py-2.5 text-slate-900 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
          >
            {texts.userMenu.changePassword}
          </Link>
          <div className="border-t border-slate-100" />
          <div className="px-1 py-1">
            <SignOutButton className="block w-full rounded px-2 py-2 text-left text-slate-900 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
