import Link from "next/link";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { texts } from "@/lib/auth/texts";

export default function AccessDenied() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="text-lg font-semibold">{texts.denied.title}</h2>
      <p className="mt-2 text-sm">{texts.denied.body}</p>
      <Link href={AUTH_ROUTES.home} className="mt-4 inline-block text-sm font-medium underline">
        {texts.common.backToHome}
      </Link>
    </div>
  );
}
