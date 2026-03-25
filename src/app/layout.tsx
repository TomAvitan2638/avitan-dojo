import type { Metadata } from "next";
import { SessionTimeoutGuard } from "@/components/auth/session-timeout-guard";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avitan Dojo",
  description: "Karate Dojo Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen bg-background">
        <TooltipProvider delayDuration={200} skipDelayDuration={0} disableHoverableContent>
          <SessionTimeoutGuard />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
