import "server-only";
import { requirePageAuth, type GuardOptions } from "@/lib/auth/helpers";
import type { RoleInput } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/server";
import AccessDenied from "./AccessDenied";
import PendingApproval from "./PendingApproval";

type Props = GuardOptions & {
  /** Path della pagina, usato come callbackUrl se l'utente non è loggato. */
  callbackPath: string;
  roles?: RoleInput;
  /** Render prop: riceve l'utente autorizzato. */
  children: (user: SessionUser) => React.ReactNode;
};

/**
 * Protegge una pagina (server component):
 * non loggato → redirect al login; ruolo pending → <PendingApproval/>;
 * ruolo non ammesso → <AccessDenied/>; altrimenti renderizza children(user).
 *
 *   <AuthGate callbackPath="/admin" roles="ADMIN">{(user) => <Admin user={user} />}</AuthGate>
 */
export default async function AuthGate({ callbackPath, roles, allowPending, children }: Props) {
  const r = await requirePageAuth(callbackPath, roles, { allowPending });
  if (r.ok) return <>{children(r.user)}</>;
  if (r.reason === "pending") return <PendingApproval />;
  return <AccessDenied />;
}
