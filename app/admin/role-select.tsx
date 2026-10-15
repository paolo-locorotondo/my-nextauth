"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "./actions";

export default function RoleSelect({ userId, role, roles }: { userId: string; role: string; roles: readonly string[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const r = await setUserRole(userId, next);
            setError(r.ok ? null : r.error);
          });
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
