"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cake, Eye } from "lucide-react";
import Link from "next/link";
import type { UpcomingBirthdayStudent } from "@/server/services/reminder-service";
import { cn } from "@/lib/utils";

type Props = {
  birthdays: UpcomingBirthdayStudent[];
};

function birthdayRelativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return "היום";
  if (daysUntil === 1) return "מחר";
  return `עוד ${daysUntil} ימים`;
}

export function BirthdaysWidget({ birthdays }: Props) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-dojo-red/10 p-2">
            <Cake className="size-5 text-dojo-red" />
          </div>
          <CardTitle className="text-lg">ימי הולדת קרובים</CardTitle>
        </div>
        <span className="rounded-full bg-dojo-red/10 px-2.5 py-0.5 text-xs font-medium text-dojo-red">
          {birthdays.length}
        </span>
      </CardHeader>
      <CardContent>
        {birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Cake className="size-12 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              אין ימי הולדת ב-7 הימים הבאים
            </p>
          </div>
        ) : (
          <div className="space-y-3" dir="rtl">
            {birthdays.map((birthday) => {
              const name = `${birthday.firstName} ${birthday.lastName}`;
              const age = birthday.ageTurning ?? "—";
              const subtitle = birthday.groupName ?? "—";
              const relative = birthdayRelativeLabel(birthday.daysUntil);
              return (
                <div
                  key={birthday.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-3 transition-colors",
                    birthday.isToday
                      ? "border border-dojo-red/45 bg-gradient-to-br from-dojo-red/25 via-dojo-red/10 to-zinc-900/40 shadow-[0_0_18px_rgba(220,38,38,0.14)] ring-1 ring-dojo-red/35"
                      : "bg-secondary/50"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full text-sm font-bold",
                          birthday.isToday
                            ? "bg-dojo-red/30 text-dojo-red ring-2 ring-dojo-red/45"
                            : "bg-dojo-red/10 text-dojo-red"
                        )}
                      >
                        {age}
                      </div>
                      <span
                        className={cn(
                          "max-w-[5rem] text-center text-[11px] leading-tight text-muted-foreground",
                          birthday.isToday && "font-medium text-dojo-red/90"
                        )}
                      >
                        {relative}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {birthday.isToday ? (
                          <span
                            className="inline-flex items-center gap-1.5"
                            dir="ltr"
                            title="יום הולדת היום"
                          >
                            <span aria-hidden>🎉</span>
                            <span dir="rtl">{name}</span>
                            <span aria-hidden>🎈</span>
                          </span>
                        ) : (
                          name
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/students/${birthday.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="ml-1 size-4" />
                      צפייה
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
