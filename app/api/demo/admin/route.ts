import { NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db";

/** Demo: solo ADMIN (401 se non loggato, 403 se ruolo diverso). */
export async function GET(request: Request) {
  const auth = await validateAuth(request, "ADMIN");
  if (!auth.ok) return auth.errorResponse;

  const users = await prisma.user.count();
  return NextResponse.json({ ok: true, users }, { headers: { "Cache-Control": "no-store" } });
}
