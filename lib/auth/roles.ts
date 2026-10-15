import { ADMIN_ROLES, PENDING_ROLES, ROLES, type Role } from "./config";

export type RoleInput = Role | readonly Role[];

const toArray = (roles: RoleInput): readonly Role[] => (typeof roles === "string" ? [roles] : roles);

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** true se l'utente ha almeno uno dei ruoli richiesti (nessun ruolo richiesto = true). */
export function hasRole(user: { role?: string | null } | null | undefined, roles?: RoleInput): boolean {
  if (!user) return false;
  if (!roles) return true;
  return isRole(user.role) && toArray(roles).includes(user.role);
}

export function isPending(user: { role?: string | null } | null | undefined): boolean {
  return !!user && isRole(user.role) && PENDING_ROLES.includes(user.role);
}

export function isAdmin(user: { role?: string | null } | null | undefined): boolean {
  return hasRole(user, ADMIN_ROLES);
}
