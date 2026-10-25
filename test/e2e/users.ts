import { type APIRequestContext } from "@playwright/test";
import { prepareUser } from "./db";

export const PASSWORD = "Prova-pass-1";

/** Crea un utente verificato con il ruolo voluto (registrazione via API, poi DB). */
export async function createUser(request: APIRequestContext, baseURL: string, email: string, role: string, name = "E2E") {
  const res = await request.post("/api/auth/sign-up/email", {
    data: { name, email, password: PASSWORD },
    headers: { Origin: baseURL },
  });
  if (!res.ok()) throw new Error(`sign-up ${email} fallita: ${res.status()} ${await res.text()}`);
  prepareUser(email, role);
}
