import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const shimmerLine =
  "animate-shimmer bg-gradient-to-r from-stone-400/55 via-stone-300/75 to-stone-400/55 bg-[length:200%_100%]";

/** Shimmer gradient class for tab list / table loading placeholders (cream theme). */
export const LIST_PAGE_SHIMMER_CLASS = shimmerLine;

/** Dashboard-quality banner for entity tabs (Groups, Payments, etc.) — clearly not empty state. */
export function ListLoadingBanner({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dojo-red/35 bg-card px-4 py-3 shadow-[0_0_20px_rgba(185,28,28,0.08)]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-dojo-red" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Groups grid placeholder with shimmer — use with {@link ListLoadingBanner} above. */
export function GroupsListSkeletonGrid() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-busy="true"
      aria-label="טוען רשימת קבוצות"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card
          key={i}
          className="flex h-full flex-col overflow-hidden border border-border bg-card shadow-sm ring-1 ring-border/40"
        >
          <CardHeader className="shrink-0 space-y-2 pb-3">
            <div
              className={cn(
                "h-7 max-w-[14rem] rounded-md",
                LIST_PAGE_SHIMMER_CLASS
              )}
            />
            <div
              className={cn("h-4 max-w-[9rem] rounded-md", LIST_PAGE_SHIMMER_CLASS)}
            />
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 pb-6">
            <div
              className={cn("h-4 w-full rounded-md", LIST_PAGE_SHIMMER_CLASS)}
            />
            <div className="space-y-2">
              <div
                className={cn(
                  "h-12 rounded-md border border-border/50",
                  LIST_PAGE_SHIMMER_CLASS
                )}
              />
              <div
                className={cn(
                  "h-12 rounded-md border border-border/50",
                  LIST_PAGE_SHIMMER_CLASS
                )}
              />
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <div
                className={cn("h-9 flex-1 rounded-md", LIST_PAGE_SHIMMER_CLASS)}
              />
              <div
                className={cn("h-9 flex-1 rounded-md", LIST_PAGE_SHIMMER_CLASS)}
              />
              <div
                className={cn(
                  "h-9 w-9 shrink-0 rounded-md border border-border/50",
                  LIST_PAGE_SHIMMER_CLASS
                )}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Body for `/dashboard/groups` route `loading.tsx` (no toolbar). */
export function GroupsListLoadingBody() {
  return (
    <div className="space-y-6">
      <ListLoadingBanner
        title="טוען נתוני קבוצות..."
        subtitle="אנא המתן — טוענים רשימת קבוצות מהשרת"
      />
      <GroupsListSkeletonGrid />
    </div>
  );
}

/** Payments table placeholder with column header strip + shimmer rows. */
export function PaymentsListSkeletonTable() {
  return (
    <Card className="border border-border bg-card shadow-sm ring-1 ring-border/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-2 border-b-2 border-border pb-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={cn("h-5 flex-1 rounded-md", LIST_PAGE_SHIMMER_CLASS)}
            />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
          <div key={r} className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <div
                key={c}
                className={cn(
                  "h-10 flex-1 rounded-md border border-border/50",
                  LIST_PAGE_SHIMMER_CLASS
                )}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Body for `/dashboard/payments` route `loading.tsx`. */
export function PaymentsListLoadingBody() {
  return (
    <div className="space-y-6">
      <ListLoadingBanner
        title="טוען נתוני תשלומים..."
        subtitle="אנא המתן — טוענים היסטוריית תשלומים וסינונים"
      />
      <div
        className={cn(
          "h-10 max-w-xs rounded-md border border-border/60",
          LIST_PAGE_SHIMMER_CLASS
        )}
      />
      <PaymentsListSkeletonTable />
    </div>
  );
}

/** One students list table: avatar column + 7 data columns (matches real table). */
export function StudentsTableSkeletonBlock({ rowCount = 6 }: { rowCount?: number }) {
  return (
    <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-sm ring-1 ring-border/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-2 border-b-2 border-border pb-3">
          <div
            className={cn(
              "h-5 w-[52px] shrink-0 rounded-md",
              LIST_PAGE_SHIMMER_CLASS
            )}
          />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={cn("h-5 min-w-0 flex-1 rounded-md", LIST_PAGE_SHIMMER_CLASS)}
            />
          ))}
        </div>
        {Array.from({ length: rowCount }).map((_, r) => (
          <div key={r} className="flex gap-2">
            <div
              className={cn(
                "h-10 w-[52px] shrink-0 rounded-md border border-border/50",
                LIST_PAGE_SHIMMER_CLASS
              )}
            />
            {[1, 2, 3, 4, 5, 6, 7].map((c) => (
              <div
                key={c}
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-md border border-border/50",
                  LIST_PAGE_SHIMMER_CLASS
                )}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Active + inactive sections (shimmer headings — not real titles, to avoid empty-state confusion). */
export function StudentsListSkeletonDualSections() {
  return (
    <div
      className="mt-1 space-y-8"
      role="status"
      aria-busy="true"
      aria-label="טוען טבלאות תלמידים"
    >
      <div className="space-y-3">
        <div
          className={cn("h-6 max-w-[11rem] rounded-md", LIST_PAGE_SHIMMER_CLASS)}
        />
        <StudentsTableSkeletonBlock rowCount={6} />
      </div>
      <div className="space-y-3">
        <div
          className={cn("h-6 max-w-[13rem] rounded-md", LIST_PAGE_SHIMMER_CLASS)}
        />
        <StudentsTableSkeletonBlock rowCount={3} />
      </div>
    </div>
  );
}

/** Body for `/dashboard/students` route `loading.tsx` (includes search placeholder — no client toolbar). */
export function StudentsListLoadingBody() {
  return (
    <div className="space-y-6">
      <ListLoadingBanner
        title="טוען נתוני תלמידים..."
        subtitle="אנא המתן — טוענים רשימת תלמידים מהשרת"
      />
      <div
        className={cn(
          "h-10 max-w-xs rounded-md border border-border/60",
          LIST_PAGE_SHIMMER_CLASS
        )}
      />
      <StudentsListSkeletonDualSections />
    </div>
  );
}

/** Visible loading banner — distinct from empty UI (spinner + Hebrew + accent border). */
export function DashboardLoadingBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dojo-red/35 bg-card px-4 py-3 shadow-[0_0_20px_rgba(185,28,28,0.08)]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-dojo-red" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-foreground">טוען נתוני דשבורד...</p>
        <p className="text-sm text-muted-foreground">
          אנא המתן — טוענים סיכומים, ימי הולדת ותשלומים
        </p>
      </div>
    </div>
  );
}

function SkeletonCard({ children }: { children: ReactNode }) {
  return (
    <Card className="border border-border bg-card shadow-sm ring-1 ring-border/30">
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

/** Stats + widget placeholders with strong pulse/shimmer cues. */
export function DashboardStatsAndWidgetsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <DashboardLoadingBanner className="mb-2" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i}>
            <div className="space-y-3">
              <div className={cn("h-4 w-28 rounded-md", shimmerLine)} />
              <div className={cn("h-10 w-20 rounded-md", shimmerLine)} />
              <div className={cn("h-3 w-36 rounded-md opacity-80", shimmerLine)} />
            </div>
          </SkeletonCard>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <SkeletonCard key={i}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <div className={cn("h-5 w-44 rounded-md", shimmerLine)} />
                <div className={cn("h-7 w-9 rounded-full", shimmerLine)} />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className={cn("h-14 w-full rounded-lg border border-border/60", shimmerLine)}
                  />
                ))}
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
