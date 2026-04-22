"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "students" | "instructors";

type Props = {
  current: Tab;
};

/**
 * Admin-only: switch between student payments list and instructor (dojo) payments.
 */
export function AdminPaymentsAreaTabs({ current }: Props) {
  return (
    <div
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      role="tablist"
      aria-label="בחירת סוג תשלומים"
    >
      <Link
        href="/dashboard/payments"
        role="tab"
        aria-selected={current === "students"}
        className={cn(
          "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center",
          current === "students"
            ? "bg-dojo-red/15 text-foreground ring-1 ring-dojo-red/30"
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        תלמידים
      </Link>
      <Link
        href="/dashboard/payments?paymentsTab=instructors"
        role="tab"
        aria-selected={current === "instructors"}
        className={cn(
          "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center",
          current === "instructors"
            ? "bg-dojo-red/15 text-foreground ring-1 ring-dojo-red/30"
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        מאמנים
      </Link>
    </div>
  );
}
