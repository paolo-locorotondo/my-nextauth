import Link from "next/link";
import { AUTH_ROUTES } from "@/lib/auth/config";
import { texts } from "@/lib/auth/texts";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      {children}
      <Link href={AUTH_ROUTES.home} className="text-sm text-slate-500 hover:text-slate-700">
        {texts.common.backToHome}
      </Link>
    </main>
  );
}
