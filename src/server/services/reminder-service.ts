import { prisma } from "@/lib/db";
import { MembershipStatus, StudentStatus } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { startOfDay, subMonths } from "date-fns";

/** Dashboard birthdays use Israel civil calendar, not server default (often UTC on Vercel). */
const DOJO_TIME_ZONE = "Asia/Jerusalem";

function getCalendarPartsInDojoTz(date: Date): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DOJO_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  let year = 0;
  let monthIndex = 0;
  let day = 0;
  for (const p of parts) {
    if (p.type === "year") year = Number(p.value);
    else if (p.type === "month") monthIndex = Number(p.value) - 1;
    else if (p.type === "day") day = Number(p.value);
  }
  return { year, monthIndex, day };
}

/** Gregorian civil day increment (y/m/d only; no clock / UTC “day” boundaries). */
function addCivilDays(
  year: number,
  monthIndex: number,
  day: number,
  deltaDays: number
): { year: number; monthIndex: number; day: number } {
  const x = new Date(Date.UTC(year, monthIndex, day + deltaDays));
  return {
    year: x.getUTCFullYear(),
    monthIndex: x.getUTCMonth(),
    day: x.getUTCDate(),
  };
}

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
  const now = new Date();
  const { monthIndex, day: todayDay } = getCalendarPartsInDojoTz(now);

  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          status: StudentStatus.active,
          birthDate: { not: null },
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : { status: StudentStatus.active, birthDate: { not: null } };

  const students = await prisma.student.findMany({
    where: whereClause,
    select: { id: true, firstName: true, lastName: true, birthDate: true },
  });

  const withBirthdayToday = students.filter((s) => {
    if (!s.birthDate) return false;
    const parts = getCalendarPartsInDojoTz(new Date(s.birthDate));
    return parts.monthIndex === monthIndex && parts.day === todayDay;
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
  const now = new Date();
  const today = getCalendarPartsInDojoTz(now);

  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          status: StudentStatus.active,
          birthDate: { not: null },
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : { status: StudentStatus.active, birthDate: { not: null } };

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
    const birthParts = getCalendarPartsInDojoTz(new Date(s.birthDate));
    const bm = birthParts.monthIndex;
    const birthDayOfMonth = birthParts.day;
    const birthYear = birthParts.year;

    let daysUntil: number | null = null;
    let anniversaryYear: number | null = null;

    for (let delta = 0; delta <= 7; delta++) {
      const c = addCivilDays(
        today.year,
        today.monthIndex,
        today.day,
        delta
      );
      if (c.monthIndex === bm && c.day === birthDayOfMonth) {
        daysUntil = delta;
        anniversaryYear = c.year;
        break;
      }
    }

    if (daysUntil === null || anniversaryYear === null) continue;

    const ageTurning = anniversaryYear - birthYear;
    const groupName = s.memberships[0]?.group?.name ?? null;

    results.push({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      birthDate: s.birthDate,
      ageTurning,
      groupName,
      isToday: daysUntil === 0,
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
