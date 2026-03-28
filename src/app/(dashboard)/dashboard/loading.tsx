import { Loader2 } from "lucide-react";

/**
 * Route-neutral fallback for the `/dashboard` segment during navigations to any
 * child route. Avoids dashboard-home visuals (hero, KPI skeletons, "דשבורד" title)
 * so users do not briefly think the main Dashboard page opened first.
 * Leaf routes (e.g. students/loading.tsx) supply section-specific UI when they suspend.
 */
export default function DashboardSegmentLoading() {
  return (
    <div className="min-h-screen" dir="rtl">
      <div className="border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div
          className="h-6 max-w-[9rem] animate-pulse rounded-md bg-muted/60"
          aria-hidden
        />
      </div>
      <div className="p-6">
        <div
          className="rounded-lg border border-border/50 bg-card shadow-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="טוען"
        >
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16">
            <Loader2 className="h-10 w-10 shrink-0 animate-spin text-muted-foreground" />
            <p className="text-base text-muted-foreground">טוען...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
