import { prisma } from "@/lib/db";
import { MembershipStatus } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import {
  startOfDay,
  addDays,
  differenceInYears,
  differenceInCalendarDays,
  subMonths,
} from "date-fns";

export type BirthdayStudent = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
};

export type UpcomingBirthdayStudent = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  ageTurning: number | null;
  groupName: string | null;
  isToday: boolean;
  /** Calendar days from today until next birthday (0 = today) */
  daysUntil: number;
};

export type OverduePaymentItem = {
  membershipId: string;
  studentId: string;
  studentName: string;
  groupName: string;
  paymentDueDate: Date;
  daysOverdue: number;
};

export type LatePaymentItem = {
  studentId: string;
  studentName: string;
  groupName: string;
  membershipId: string;
  missingMonthsCount: number;
  missingMonthsLabel: string;
};

function buildStudentInstructorFilter(user: CurrentUser) {
  if (user.role === "INSTRUCTOR" && user.instructorId) {
    return {
      memberships: {
        some: { group: { instructorId: user.instructorId } },
      },
    };
  }
  return {};
}

/**
 * Returns students with birthday today.
 * Kept for backwards compatibility.
 */
export async function getBirthdaysToday(
  user: CurrentUser
): Promise<BirthdayStudent[]> {
  const today = startOfDay(new Date());
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          birthDate: { not: null },
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : { birthDate: { not: null } };

  const students = await prisma.student.findMany({
    where: whereClause,
    select: { id: true, firstName: true, lastName: true, birthDate: true },
  });

  const withBirthdayToday = students.filter((s) => {
    if (!s.birthDate) return false;
    const bd = new Date(s.birthDate);
    return bd.getMonth() + 1 === month && bd.getDate() === day;
  });

  const distinctById = Array.from(
    new Map(withBirthdayToday.map((s) => [s.id, s])).values()
  );
  distinctById.sort((a, b) =>
    `${a.firstName} ${a.lastName}`.toLowerCase().localeCompare(
      `${b.firstName} ${b.lastName}`.toLowerCase()
    )
  );

  return distinctById.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    birthDate: s.birthDate,
  }));
}

/**
 * Returns students with birthdays in the next 7 days (including today).
 * - Sorted ascending by closest birthday
 * - Handles Dec → Jan boundary
 * - Includes age turning, group, isToday
 */
export async function getUpcomingBirthdays(
  user: CurrentUser
): Promise<UpcomingBirthdayStudent[]> {
  const today = startOfDay(new Date());
  const endDate = addDays(today, 7);

  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          birthDate: { not: null },
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : { birthDate: { not: null } };

  const students = await prisma.student.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      memberships: {
        where: { status: MembershipStatus.active },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { group: { select: { name: true } } },
      },
    },
  });

  const results: UpcomingBirthdayStudent[] = [];

  for (const s of students) {
    if (!s.birthDate) continue;
    const bd = new Date(s.birthDate);
    const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    const nextYearBd = new Date(
      today.getFullYear() + 1,
      bd.getMonth(),
      bd.getDate()
    );

    // Next birthday is this year or next year
    const nextBd =
      thisYearBd >= today ? thisYearBd : nextYearBd;
    const nextBdStart = startOfDay(nextBd);

    if (nextBdStart > endDate) continue;

    const daysUntil = differenceInCalendarDays(nextBdStart, today);
    const isToday = daysUntil === 0;
    const ageTurning = differenceInYears(nextBd, bd);
    const groupName =
      s.memberships[0]?.group?.name ?? null;

    results.push({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      birthDate: s.birthDate,
      ageTurning,
      groupName,
      isToday,
      daysUntil,
    });
  }

  // Closest birthday first (today at top)
  results.sort((a, b) => a.daysUntil - b.daysUntil);

  return results;
}

/**
 * Returns overdue payment reminders at membership level.
 * Kept for backwards compatibility.
 */
export async function getOverduePayments(
  user: CurrentUser
): Promise<OverduePaymentItem[]> {
  const today = startOfDay(new Date());
  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          status: MembershipStatus.active,
          paymentDueDate: { not: null, lte: today },
          group: { instructorId: user.instructorId },
        }
      : {
          status: MembershipStatus.active,
          paymentDueDate: { not: null, lte: today },
        };

  const memberships = await prisma.studentMembership.findMany({
    where: whereClause,
    select: {
      id: true,
      paymentDueDate: true,
      student: { select: { id: true, firstName: true, lastName: true } },
      group: { select: { name: true } },
    },
    orderBy: { paymentDueDate: "asc" },
  });

  return memberships
    .filter((m): m is typeof m & { paymentDueDate: Date } => m.paymentDueDate != null)
    .map((m) => ({
      membershipId: m.id,
      studentId: m.student.id,
      studentName: `${m.student.firstName} ${m.student.lastName}`,
      groupName: m.group.name,
      paymentDueDate: new Date(m.paymentDueDate),
      daysOverdue: Math.floor(
        (today.getTime() - new Date(m.paymentDueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));
}

/**
 * Returns active students with missing monthly payments for last 3 calendar months.
 * - One row per student (no duplicates for multiple memberships)
 * - Student registration date = MIN(StudentMembership.startDate) across all memberships
 * - Month is paid if Payment with type MONTHLY has PaymentMonth for that year+month
 * - Sorted by missing months count DESC
 */
export async function getLatePayments(
  user: CurrentUser
): Promise<LatePaymentItem[]> {
  const today = startOfDay(new Date());
  const instructorFilter = buildStudentInstructorFilter(user);

  const students = await prisma.student.findMany({
    where: {
      status: "active",
      ...instructorFilter,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberships: {
        where: { status: MembershipStatus.active, endDate: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          startDate: true,
          group: { select: { name: true } },
        },
      },
    },
  });

  const studentIds = students.map((s) => s.id);
  const paidMonthsRaw = await prisma.paymentMonth.findMany({
    where: {
      payment: {
        studentId: { in: studentIds },
        paymentType: "MONTHLY",
      },
    },
    select: {
      year: true,
      month: true,
      payment: { select: { studentId: true } },
    },
  });

  const paidByStudent = new Map<string, Set<string>>();
  for (const pm of paidMonthsRaw) {
    const key = `${pm.year}-${pm.month}`;
    const set = paidByStudent.get(pm.payment.studentId) ?? new Set();
    set.add(key);
    paidByStudent.set(pm.payment.studentId, set);
  }

  const monthsToCheck: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const d = subMonths(today, i);
    monthsToCheck.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }

  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];

  const results: LatePaymentItem[] = [];

  for (const student of students) {
    if (student.memberships.length === 0) continue;

    // Registration date = earliest membership startDate (system stores תאריך הרשמה as first membership startDate)
    const registrationDate = student.memberships.reduce(
      (min, m) => (m.startDate < min ? m.startDate : min),
      student.memberships[0].startDate
    );
    const joinDate = new Date(registrationDate);

    const requiredMonths: { year: number; month: number }[] = [];
    for (const m of monthsToCheck) {
      const monthStart = new Date(m.year, m.month - 1, 1);
      if (monthStart >= joinDate) {
        requiredMonths.push(m);
      }
    }

    const paid = paidByStudent.get(student.id) ?? new Set();
    const missing: { year: number; month: number }[] = [];
    for (const m of requiredMonths) {
      const key = `${m.year}-${m.month}`;
      if (!paid.has(key)) missing.push(m);
    }

    if (missing.length === 0) continue;

    const primaryMembership = student.memberships[0];
    const missingLabels = missing
      .map((m) => `${monthNames[m.month - 1]} ${m.year}`)
      .join(", ");

    results.push({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      groupName: primaryMembership.group.name,
      membershipId: primaryMembership.id,
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
