import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertCircle, Layers } from "lucide-react";
import type { DashboardStats } from "@/server/services/dashboard-service";
import { cn } from "@/lib/utils";
import { MonthlyPaymentsStatCard } from "@/components/dashboard/monthly-payments-stat-card";

function formatChange(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

type Props = {
  stats: DashboardStats;
};

type StatCardDef = {
  title: string;
  value: string;
  change: string;
  changeLabel: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  /** תלמידים פעילים: הצטרפות החודש + אחוז שינוי לעומת חודש קודם (אם יש בסיס) */
  activeJoin?: {
    joinedThisMonth: number;
    monthOverMonthPercent: number | null;
  };
};

export function StatsCards({ stats }: Props) {
  const cards: StatCardDef[] = [
    {
      title: "תלמידים פעילים",
      value: String(stats.activeStudents.count),
      change: "",
      changeLabel: "",
      activeJoin: {
        joinedThisMonth: stats.activeStudents.joinedThisMonth,
        monthOverMonthPercent:
          stats.activeStudents.joinMonthOverMonthPercent,
      },
      icon: Users,
      color: "text-dojo-red",
      bgColor: "bg-dojo-red/10",
    },
    {
      title: "תלמידים שפרשו",
      value: String(stats.expiredMemberships.count),
      change: String(stats.expiredMemberships.endedThisMonth),
      changeLabel: "תלמידים שפרשו החודש",
      icon: AlertCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "קבוצות פעילות",
      value: String(stats.activeGroups.count),
      change:
        stats.activeGroups.delta != null
          ? formatChange(stats.activeGroups.delta)
          : "—",
      changeLabel: "קבוצות חדשות",
      icon: Layers,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.change.startsWith("+") && stat.change !== "—";
        const isNegative = stat.change.startsWith("-");
        const aj = stat.activeJoin;
        const pct = aj?.monthOverMonthPercent;

        return (
          <Card key={stat.title} className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  {aj ? (
                    <p className="mt-1 text-xs leading-relaxed">
                      <span className="text-muted-foreground">
                        {aj.joinedThisMonth} הצטרפו החודש
                      </span>
                      {pct != null ? (
                        <span
                          className={cn(
                            "ms-1 font-semibold",
                            pct > 0 && "text-emerald-500",
                            pct < 0 && "text-red-500",
                            pct === 0 && "text-muted-foreground"
                          )}
                        >
                          ({pct > 0 ? "+" : ""}
                          {pct}%)
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span
                        className={
                          isPositive
                            ? "text-emerald-500"
                            : isNegative
                              ? "text-amber-500"
                              : ""
                        }
                      >
                        {stat.change}
                      </span>{" "}
                      {stat.changeLabel}
                    </p>
                  )}
                </div>
                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                  <Icon className={`size-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <MonthlyPaymentsStatCard monthlyPayments={stats.monthlyPayments} />
    </div>
  );
}
