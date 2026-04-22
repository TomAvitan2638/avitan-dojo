"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, MoreHorizontal } from "lucide-react";
import type { DashboardStats } from "@/server/services/dashboard-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonthlyIncomeHistoryModal } from "@/components/dashboard/monthly-income-history-modal";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatChange(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

type Props = {
  monthlyPayments: DashboardStats["monthlyPayments"];
};

export function MonthlyPaymentsStatCard({ monthlyPayments }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const change =
    monthlyPayments.deltaPercent != null
      ? `${monthlyPayments.deltaPercent >= 0 ? "+" : ""}${monthlyPayments.deltaPercent}%`
      : formatChange(monthlyPayments.delta) !== "0"
        ? formatChange(monthlyPayments.delta)
        : "—";

  const isPositive = change.startsWith("+") && change !== "—";
  const isNegative = change.startsWith("-");

  return (
    <>
      <Card className="border-border/50 bg-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">תשלומים החודש</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                {formatCurrency(monthlyPayments.thisMonth)}
              </p>
              <div
                className="mt-1 space-y-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs"
                dir="rtl"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0">מתלמידים:</span>
                  <span
                    className="min-w-0 whitespace-nowrap text-end font-medium tabular-nums text-foreground/85"
                    dir="ltr"
                  >
                    {formatCurrency(monthlyPayments.studentThisMonth)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0">ממאמנים:</span>
                  <span
                    className="min-w-0 whitespace-nowrap text-end font-medium tabular-nums text-foreground/85"
                    dir="ltr"
                  >
                    {formatCurrency(monthlyPayments.coachThisMonth)}
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    isPositive && "text-emerald-500",
                    isNegative && "text-amber-500"
                  )}
                >
                  {change}
                </span>{" "}
                מהחודש שעבר
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="אפשרויות תשלומים החודש"
                  >
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem
                    className="cursor-pointer text-base"
                    onSelect={() => setHistoryOpen(true)}
                  >
                    צפייה בנתוני עבר
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="rounded-xl bg-dojo-gold/10 p-3">
                <CreditCard className="size-6 text-dojo-gold" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MonthlyIncomeHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}
