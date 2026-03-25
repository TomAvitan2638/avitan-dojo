"use client";

import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen" dir="rtl">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 animate-pulse rounded bg-muted/50" />
        </div>
      </header>
      <div className="p-6">
        <div className="mb-6 h-8 w-40 animate-pulse rounded bg-muted/50" />
        <div className="rounded-lg border border-border/50 bg-card">
          <div
            className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8"
            role="status"
            aria-label="טוען"
          >
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">טוען...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
