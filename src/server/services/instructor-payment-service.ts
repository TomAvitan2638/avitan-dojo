import { startOfDay, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

/**
 * Dashboard overdue row for instructor monthly fees (dojo owner view).
 * Separate from student {@link getLatePayments} in reminder-service.
 */
export type LateInstructorPaymentItem = {
  instructorId: string;
  instructorName: string;
  missingMonthsCount: number;
  missingMonthsLabel: string;
};

const monthNamesHe = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

/**
 * Active instructors missing covered-month rows for any of the last 3 calendar months.
 * Paid months come from {@link InstructorPaymentMonth} (not paymentDate).
 * Only {@link CurrentUser} with role ADMIN receives data; others get an empty list.
 */
export async function getLateInstructorPayments(
  user: CurrentUser
): Promise<LateInstructorPaymentItem[]> {
  if (user.role !== "ADMIN") {
    return [];
  }

  const today = startOfDay(new Date());

  const monthsToCheck: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = subMonths(today, i);
    monthsToCheck.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }

  const instructors = await prisma.instructor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  if (instructors.length === 0) {
    return [];
  }

  const instructorIds = instructors.map((i) => i.id);

  const coverageRows = await prisma.instructorPaymentMonth.findMany({
    where: { instructorId: { in: instructorIds } },
    select: {
      instructorId: true,
      year: true,
      month: true,
    },
  });

  const paidByInstructor = new Map<string, Set<string>>();
  for (const row of coverageRows) {
    const key = `${row.year}-${row.month}`;
    const set = paidByInstructor.get(row.instructorId) ?? new Set<string>();
    set.add(key);
    paidByInstructor.set(row.instructorId, set);
  }

  const results: LateInstructorPaymentItem[] = [];

  for (const inst of instructors) {
    const joinDate = startOfDay(new Date(inst.createdAt));

    const requiredMonths: { year: number; month: number }[] = [];
    for (const m of monthsToCheck) {
      const monthStart = new Date(m.year, m.month - 1, 1);
      if (monthStart >= joinDate) {
        requiredMonths.push(m);
      }
    }

    const paid = paidByInstructor.get(inst.id) ?? new Set<string>();
    const missing: { year: number; month: number }[] = [];
    for (const m of requiredMonths) {
      const key = `${m.year}-${m.month}`;
      if (!paid.has(key)) {
        missing.push(m);
      }
    }

    if (missing.length === 0) {
      continue;
    }

    const missingLabels = missing
      .map((m) => `${monthNamesHe[m.month - 1]} ${m.year}`)
      .join(", ");

    results.push({
      instructorId: inst.id,
      instructorName: `${inst.firstName} ${inst.lastName}`,
      missingMonthsCount: missing.length,
      missingMonthsLabel:
        missing.length === 1
          ? `חודש חסר: ${missingLabels}`
          : `${missing.length} חודשים חסרים: ${missingLabels}`,
    });
  }

  results.sort((a, b) => b.missingMonthsCount - a.missingMonthsCount);
  return results;
}
