import { NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth/helpers";

/** Demo: qualsiasi utente loggato, anche in attesa di approvazione. */
export async function GET(request: Request) {
  const auth = await validateAuth(request, undefined, { allowPending: true });
  if (!auth.ok) return auth.errorResponse;

  const { id, name, email, emailVerified, role } = auth.user;
  return NextResponse.json({ user: { id, name, email, emailVerified, role } }, { headers: { "Cache-Control": "no-store" } });
}
