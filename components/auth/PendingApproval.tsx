import { texts } from "@/lib/auth/texts";

export default function PendingApproval() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:p-6">
      <h2 className="text-lg font-semibold">{texts.pending.title}</h2>
      <p className="mt-2 text-sm">{texts.pending.body}</p>
    </div>
  );
}
