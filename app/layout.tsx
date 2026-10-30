import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/auth/Toast";
import "./globals.css";

// Esplicito: la scala iniziale è 1 e lo zoom resta consentito (accessibilità)
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "my-nextauth",
  description: "Template di autenticazione per Next.js basato su Better Auth",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
