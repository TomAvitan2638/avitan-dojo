"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "./sidebar";

type Props = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: Props) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setPendingHref(null);
    setIsNavigating(false);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    setPendingHref(href);
    setIsNavigating(true);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar pendingHref={pendingHref} onNavClick={handleNavClick} />
      <main className="relative mr-64 min-h-screen transition-all duration-300">
        {children}
        {isNavigating && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-label="טוען"
          >
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">טוען...</p>
          </div>
        )}
      </main>
    </div>
  );
}
