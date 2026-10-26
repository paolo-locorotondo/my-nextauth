"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export type Voce = { href: string; label: string; figli?: Voce[] };

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";

function attiva(pathname: string, v: Voce) {
  if (v.href === "/") return pathname === "/";
  return pathname === v.href || pathname.startsWith(`${v.href}/`);
}

/** Chiude `aperto` con Esc e con il clic fuori da `contenitore`. */
function useChiusura(aperto: boolean, chiudi: () => void, contenitore: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!aperto) return;
    function fuori(e: MouseEvent) {
      if (!contenitore.current?.contains(e.target as Node)) chiudi();
    }
    function tasto(e: KeyboardEvent) {
      if (e.key === "Escape") chiudi();
    }
    document.addEventListener("mousedown", fuori);
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("mousedown", fuori);
      document.removeEventListener("keydown", tasto);
    };
  }, [aperto, chiudi, contenitore]);
}

/** Voci in linea per desktop (da `md`). Un gruppo ha il link della sezione e una tendina con le sottovoci. */
export function NavDesktop({ voci }: { voci: Voce[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sezioni" className="hidden items-center gap-1 text-sm md:flex">
      {voci.map((v) =>
        v.figli?.length ? (
          <GruppoDesktop key={v.href} voce={v} pathname={pathname} />
        ) : (
          <Link
            key={v.href}
            href={v.href}
            aria-current={attiva(pathname, v) ? "page" : undefined}
            className={`rounded px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-blue-600 ${focusRing}`}
          >
            {v.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function GruppoDesktop({ voce, pathname }: { voce: Voce; pathname: string }) {
  const [aperto, setAperto] = useState(false);
  const contenitore = useRef<HTMLDivElement>(null);
  const idMenu = useId();
  const chiudi = () => setAperto(false);
  useChiusura(aperto, chiudi, contenitore);

  // Si chiude al cambio pagina: confronto durante il render, senza effect
  const [pathPrecedente, setPathPrecedente] = useState(pathname);
  if (pathPrecedente !== pathname) {
    setPathPrecedente(pathname);
    setAperto(false);
  }

  return (
    <div ref={contenitore} className="relative flex items-center">
      <Link
        href={voce.href}
        aria-current={pathname === voce.href ? "page" : undefined}
        className={`rounded-l px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-blue-600 ${attiva(pathname, voce) ? "font-semibold text-blue-600" : ""} ${focusRing}`}
      >
        {voce.label}
      </Link>
      <button
        type="button"
        aria-expanded={aperto}
        aria-controls={idMenu}
        onClick={() => setAperto((v) => !v)}
        className={`rounded-r px-1 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
      >
        <span className="sr-only">{`Sottovoci di ${voce.label}`}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${aperto ? "rotate-180" : ""}`}>
          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {aperto && (
        <ul id={idMenu} className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded border border-slate-200 bg-white py-1 shadow-md">
          {voce.figli!.map((f) => (
            <li key={f.href}>
              <Link
                href={f.href}
                aria-current={pathname === f.href ? "page" : undefined}
                className={`block px-3 py-2 text-slate-900 hover:bg-slate-50 aria-[current=page]:font-semibold aria-[current=page]:text-blue-600 ${focusRing}`}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Menu hamburger per telefono (sotto `md`). Il pannello si ancora all'header (che è `relative`),
 * quindi occupa tutta la larghezza sotto la barra e non copre il menu utente.
 */
export default function MenuSezioni({ voci }: { voci: Voce[] }) {
  const [aperto, setAperto] = useState(false);
  const [gruppiAperti, setGruppiAperti] = useState<string[]>([]);
  const pathname = usePathname();
  const idMenu = useId();
  const contenitore = useRef<HTMLDivElement>(null);
  const pulsante = useRef<HTMLButtonElement>(null);
  useChiusura(aperto, () => setAperto(false), contenitore);

  // Chiude quando cambia pagina: si confronta durante il render, senza effect
  const [pathPrecedente, setPathPrecedente] = useState(pathname);
  if (pathPrecedente !== pathname) {
    setPathPrecedente(pathname);
    setAperto(false);
  }

  function alterna(href: string) {
    setGruppiAperti((g) => (g.includes(href) ? g.filter((x) => x !== href) : [...g, href]));
  }

  const voceClass =
    "flex min-h-11 flex-1 items-center rounded px-3 text-base text-slate-900 hover:bg-slate-100 aria-[current=page]:font-semibold aria-[current=page]:text-blue-600 " + focusRing;

  return (
    <div ref={contenitore} className="md:hidden">
      <button
        ref={pulsante}
        type="button"
        aria-expanded={aperto}
        aria-controls={idMenu}
        onClick={() => setAperto((v) => !v)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-900 hover:bg-slate-50 ${focusRing}`}
      >
        <span className="sr-only">{aperto ? "Chiudi le sezioni" : "Apri le sezioni"}</span>
        <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
          {aperto ? (
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {aperto && (
        <nav id={idMenu} aria-label="Sezioni" className="absolute inset-x-0 top-full z-30 border-b border-slate-200 bg-white px-2 py-2 shadow-md">
          <ul className="mx-auto flex max-w-7xl flex-col">
            {voci.map((v) => {
              const figli = v.figli ?? [];
              const aperta = gruppiAperti.includes(v.href) || (figli.length > 0 && attiva(pathname, v));
              const idGruppo = `${idMenu}-${v.href.replace(/\W/g, "")}`;
              return (
                <li key={v.href}>
                  <div className="flex items-center">
                    <Link href={v.href} aria-current={pathname === v.href ? "page" : undefined} className={voceClass}>
                      {v.label}
                    </Link>
                    {figli.length > 0 && (
                      <button
                        type="button"
                        aria-expanded={aperta}
                        aria-controls={idGruppo}
                        onClick={() => alterna(v.href)}
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded hover:bg-slate-100 ${focusRing}`}
                      >
                        <span className="sr-only">{`Sottovoci di ${v.label}`}</span>
                        <svg aria-hidden viewBox="0 0 20 20" className={`h-5 w-5 text-slate-600 transition-transform ${aperta ? "rotate-180" : ""}`}>
                          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {figli.length > 0 && aperta && (
                    <ul id={idGruppo} className="mb-1 ml-5 border-l border-slate-200 pl-2">
                      {figli.map((f) => (
                        <li key={f.href}>
                          <Link href={f.href} aria-current={pathname === f.href ? "page" : undefined} className={voceClass}>
                            {f.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
