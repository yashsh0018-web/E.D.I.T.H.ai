import type { Metadata } from "next";
import "./globals.css";
import { SafetyProvider } from "@/lib/safety-context";

export const metadata: Metadata = {
  title: "AuraGuard (E.D.I.T.H.ai) — Autonomous AI Safety Companion",
  description: "Even Distressed, I Trigger Help. Ambient voice surveillance, covert evidence capture, and real-time WhatsApp SOS alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-on-surface data-grid selection:bg-secondary/30 selection:text-white">
        <SafetyProvider>
          {children}
        </SafetyProvider>
      </body>
    </html>
  );
}
