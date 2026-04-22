import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

/** Hebrew calendar month names (January = index 0), for income-by-month UI. */
const HEBREW_MONTH_LABELS = [
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

export type MonthlyIncomeMonthRow = {
  monthIndex: number;
  label: string;
  studentTotal: number;
  coachTotal: number;
  total: number;
};

export type MonthlyIncomeForYearResult = {
  year: number;
  months: MonthlyIncomeMonthRow[];
};

export type DashboardStats = {
  activeStudents: {
    count: number;
    joinedThisMonth: number;
    joinedLastMonth: number;
    /** ((thisMonth − lastMonth) / lastMonth) * 100, rounded; null when lastMonth === 0 */
    joinMonthOverMonthPercent: number | null;
  };
  /** "תלמידים שפרשו" — unique students by membership end_date only */
  expiredMemberships: {
    /** Distinct studentId with any row where endDate is not null */
    count: number;
    /** Distinct studentId with endDate in the current calendar month */
    endedThisMonth: number;
  };
  activeGroups: {
    count: number;
    createdThisMonth?: number;
    createdLastMonth?: number;
    delta?: number;
  };
  monthlyPayments: {
    /** Sum of student `Payment.amount` in the month (all types, same scope as before). */
    studentThisMonth: number;
    studentLastMonth: number;
    /** Instructor→owner fees; 0 for INSTRUCTOR role. */
    coachThisMonth: number;
    coachLastMonth: number;
    /** student + coach */
    thisMonth: number;
    lastMonth: number;
    delta: number;
    deltaPercent: number | null;
  };
};

function buildInstructorFilter(user: CurrentUser): Prisma.GroupWhereInput | undefined {
  if (user.role === "INSTRUCTOR" && user.instructorId) {
    return { instructorId: user.instructorId };
  }
  return undefined;
}

function buildStudentInstructorFilter(user: CurrentUser): Prisma.StudentWhereInput | undefined {
  if (user.role === "INSTRUCTOR" && user.instructorId) {
    return {
      memberships: {
        some: { group: { instructorId: user.instructorId } },
      },
    };
  }
  return undefined;
}

export async function getDashboardStats(user: CurrentUser): Promise<DashboardStats> {
  const today = startOfDay(new Date());
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  const instructorFilter = buildInstructorFilter(user);
  const studentInstructorFilter = buildStudentInstructorFilter(user);

  // 1. Active Students — main KPI: status = active; monthly joins: StudentMembership.startDate
  const activeWhere: Prisma.StudentWhereInput = {
    status: "active",
    ...studentInstructorFilter,
  };
  const activeStudentsCount = await prisma.student.count({ where: activeWhere });

  /** Active students with a membership whose start_date falls in the given month (scoped by instructor when applicable). */
  const activeJoinedInMonthWhere = (
    monthStart: Date,
    monthEnd: Date
  ): Prisma.StudentWhereInput => ({
    status: "active",
    memberships: {
      some: {
        ...(instructorFilter ? { group: instructorFilter } : {}),
        startDate: { gte: monthStart, lte: monthEnd },
      },
    },
  });

  const [joinedThisMonth, joinedLastMonth] = await Promise.all([
    prisma.student.count({
      where: activeJoinedInMonthWhere(thisMonthStart, thisMonthEnd),
    }),
    prisma.student.count({
      where: activeJoinedInMonthWhere(lastMonthStart, lastMonthEnd),
    }),
  ]);

  const joinMonthOverMonthPercent =
    joinedLastMonth > 0
      ? Math.round(
          ((joinedThisMonth - joinedLastMonth) / joinedLastMonth) * 100
        )
      : null;

  // 2. תלמידים שפרשו — endDate only; unique studentId (groupBy), not membership row counts
  const membershipEndBase: Prisma.StudentMembershipWhereInput = {
    ...(instructorFilter ? { group: instructorFilter } : {}),
  };

  const [studentsWithEndDate, studentsEndedThisMonth] = await Promise.all([
    prisma.studentMembership.groupBy({
      by: ["studentId"],
      where: {
        ...membershipEndBase,
        endDate: { not: null },
      },
    }),
    prisma.studentMembership.groupBy({
      by: ["studentId"],
      where: {
        ...membershipEndBase,
        endDate: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    }),
  ]);

  const expiredCount = studentsWithEndDate.length;
  const endedThisMonth = studentsEndedThisMonth.length;

  // 3. Active Groups - Group model has no status field; all groups are currently considered active
  const groupsWhere: Prisma.GroupWhereInput = instructorFilter ?? {};
  const [activeGroupsCount, groupsCreatedThisMonth, groupsCreatedLastMonth] = await Promise.all([
    prisma.group.count({ where: groupsWhere }),
    prisma.group.count({
      where: {
        ...groupsWhere,
        createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      },
    }),
    prisma.group.count({
      where: {
        ...groupsWhere,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
  ]);

  // 4. Monthly Payments (all payment types)
  const paymentsWhere: Prisma.PaymentWhereInput = instructorFilter
    ? { student: { memberships: { some: { group: instructorFilter } } } }
    : {};

  const coachDateThis = {
    paymentDate: { gte: thisMonthStart, lte: thisMonthEnd },
  } as const;
  const coachDateLast = {
    paymentDate: { gte: lastMonthStart, lte: lastMonthEnd },
  } as const;

  const [
    paymentsThisMonthResult,
    paymentsLastMonthResult,
    coachThisMonthResult,
    coachLastMonthResult,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        ...paymentsWhere,
        paymentDate: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...paymentsWhere,
        paymentDate: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),
    user.role === "ADMIN"
      ? prisma.instructorPayment.aggregate({
          where: coachDateThis,
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    user.role === "ADMIN"
      ? prisma.instructorPayment.aggregate({
          where: coachDateLast,
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
  ]);

  const studentThisMonth = Number(paymentsThisMonthResult._sum.amount ?? 0);
  const studentLastMonth = Number(paymentsLastMonthResult._sum.amount ?? 0);
  const coachThisMonth = Number(coachThisMonthResult._sum.amount ?? 0);
  const coachLastMonth = Number(coachLastMonthResult._sum.amount ?? 0);

  const thisMonthTotal = studentThisMonth + coachThisMonth;
  const lastMonthTotal = studentLastMonth + coachLastMonth;
  const delta = thisMonthTotal - lastMonthTotal;
  const deltaPercent =
    lastMonthTotal > 0
      ? Math.round((delta / lastMonthTotal) * 100)
      : null;

  return {
    activeStudents: {
      count: activeStudentsCount,
      joinedThisMonth,
      joinedLastMonth,
      joinMonthOverMonthPercent,
    },
    expiredMemberships: {
      count: expiredCount,
      endedThisMonth,
    },
    activeGroups: {
      count: activeGroupsCount,
      createdThisMonth: groupsCreatedThisMonth,
      createdLastMonth: groupsCreatedLastMonth,
      delta: groupsCreatedThisMonth - groupsCreatedLastMonth,
    },
    monthlyPayments: {
      studentThisMonth,
      studentLastMonth,
      coachThisMonth,
      coachLastMonth,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      delta,
      deltaPercent,
    },
  };
}

/**
 * Per calendar month: student Payment sums + InstructorPayment sums (admin only),
 * same paymentDate rules as dashboard income KPI.
 */
export async function getMonthlyIncomeForYear(
  year: number,
  user: CurrentUser
): Promise<MonthlyIncomeForYearResult> {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    throw new RangeError("Invalid year");
  }

  const instructorFilter = buildInstructorFilter(user);
  const paymentsWhere: Prisma.PaymentWhereInput = instructorFilter
    ? { student: { memberships: { some: { group: instructorFilter } } } }
    : {};

  // One month at a time: same aggregates as before, but avoids spiking the DB pool
  // with 24 concurrent queries (12 months × 2), which can fail under pool limits.
  const months: MonthlyIncomeMonthRow[] = [];
  for (let monthIndex = 0; monthIndex < HEBREW_MONTH_LABELS.length; monthIndex++) {
    const label = HEBREW_MONTH_LABELS[monthIndex];
    const monthStart = startOfMonth(new Date(year, monthIndex, 1));
    const monthEnd = endOfMonth(monthStart);
    const dateRange = { gte: monthStart, lte: monthEnd };

    const [paymentAgg, coachAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ...paymentsWhere,
          paymentDate: dateRange,
        },
        _sum: { amount: true },
      }),
      user.role === "ADMIN"
        ? prisma.instructorPayment.aggregate({
            where: { paymentDate: dateRange },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: null } }),
    ]);

    const studentTotal = Number(paymentAgg._sum.amount ?? 0);
    const coachTotal = Number(coachAgg._sum.amount ?? 0);
    months.push({
      monthIndex,
      label,
      studentTotal,
      coachTotal,
      total: studentTotal + coachTotal,
    });
  }

  return { year, months };
}
