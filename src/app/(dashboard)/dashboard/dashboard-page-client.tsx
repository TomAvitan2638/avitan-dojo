"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { BirthdaysWidget } from "@/components/dashboard/birthdays-widget";
import { OverduePaymentsWidget } from "@/components/dashboard/overdue-payments-widget";
import { DashboardStatsAndWidgetsSkeleton } from "@/components/dashboard/dashboard-loading-skeleton";
import { useDashboardPageQuery } from "@/hooks/use-dashboard-page-query";
import type { DashboardPageQueryScope } from "@/types/dashboard-page";
import { notifyDataWrite } from "@/lib/data-write-bus";

type Props = {
  queryScope: DashboardPageQueryScope;
};

export function DashboardPageClient({ queryScope }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Server redirects (e.g. record-payment) cannot call client notify — flag triggers it once. */
  useEffect(() => {
    if (searchParams.get("dataFresh") !== "1") return;
    notifyDataWrite();
    const next = new URLSearchParams(searchParams.toString());
    next.delete("dataFresh");
    const qs = next.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [searchParams, router]);

  const { data, isError, error, refetch, isPending } = useDashboardPageQuery({
    scope: queryScope,
  });

  const loadingWithoutData = isPending && !data;

  if (isError && !data) {
    return (
      <Card className="mt-6 border-destructive/30 bg-card">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : "שגיאה בטעינת הדשבורד"}
          </p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loadingWithoutData) {
    return <DashboardStatsAndWidgetsSkeleton />;
  }

  return (
    <>
      <StatsCards stats={data.stats} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BirthdaysWidget birthdays={data.birthdays} />
        <OverduePaymentsWidget items={data.latePayments} />
      </div>
    </>
  );
}
