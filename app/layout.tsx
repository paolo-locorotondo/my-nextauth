import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "my-nextauth",
  description: "Template di autenticazione per Next.js basato su Better Auth",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
