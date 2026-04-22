"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getMonthlyIncomeForYear,
  type MonthlyIncomeForYearResult,
} from "@/server/services/dashboard-service";

export type FetchMonthlyIncomeForYearResult =
  | { ok: true; data: MonthlyIncomeForYearResult }
  | { ok: false; error: string };

/**
 * Loads monthly payment totals for a calendar year (same rules as dashboard KPI).
 * Called from the dashboard income history modal only.
 */
export async function fetchMonthlyIncomeForYear(
  year: number
): Promise<FetchMonthlyIncomeForYearResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const y = Number(year);
  if (!Number.isInteger(y) || y < 1970 || y > 2100) {
    return { ok: false, error: "שנה לא תקינה" };
  }

  try {
    const data = await getMonthlyIncomeForYear(y, user);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "שגיאה בטעינת נתונים" };
  }
}
