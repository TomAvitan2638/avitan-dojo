"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Receipt } from "lucide-react";
import Link from "next/link";
import type { LatePaymentItem } from "@/server/services/reminder-service";
import type { LateInstructorPaymentItem } from "@/server/services/instructor-payment-service";

type Props = {
  items: LatePaymentItem[];
  instructorItems: LateInstructorPaymentItem[];
};

export function OverduePaymentsWidget({ items, instructorItems }: Props) {
  const total = items.length + instructorItems.length;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <AlertTriangle className="size-5 text-amber-500" />
          </div>
          <CardTitle className="text-lg">תשלומים באיחור</CardTitle>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
          {total}
        </span>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="size-12 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              אין תשלומים באיחור
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.length > 0 && (
              <section aria-label="תלמידים באיחור">
                <h3 className="mb-3 text-sm font-semibold text-foreground border-b border-border pb-2">
                  תלמידים
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.membershipId}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500">
                          {item.missingMonthsCount}
                          <span className="text-[8px]">חודשים</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              תלמיד
                            </span>
                            <p className="font-medium text-foreground truncate">
                              {item.studentName}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.groupName} • {item.missingMonthsLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Link
                          href={`/dashboard/payments?openCreate=1&paymentType=MONTHLY&studentId=${encodeURIComponent(item.studentId)}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-dojo-red hover:bg-dojo-red/10 hover:text-dojo-red"
                          >
                            <Receipt className="ml-1 size-4" />
                            רישום
                          </Button>
                        </Link>
                        <Link href={`/dashboard/students/${item.studentId}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {instructorItems.length > 0 && (
              <section aria-label="מאמנים באיחור">
                <h3 className="mb-3 text-sm font-semibold text-foreground border-b border-border pb-2">
                  מאמנים
                </h3>
                <div className="space-y-3">
                  {instructorItems.map((item) => (
                    <div
                      key={item.instructorId}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-500">
                          {item.missingMonthsCount}
                          <span className="text-[8px]">חודשים</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-dojo-red/15 px-1.5 py-0.5 text-[10px] font-medium text-dojo-red">
                              מאמן
                            </span>
                            <p className="font-medium text-foreground truncate">
                              {item.instructorName}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.missingMonthsLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Link href="/dashboard/payments?paymentsTab=instructors">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-dojo-red hover:bg-dojo-red/10 hover:text-dojo-red"
                          >
                            <Receipt className="ml-1 size-4" />
                            רישום
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
