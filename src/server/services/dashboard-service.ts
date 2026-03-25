import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

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

  const [paymentsThisMonthResult, paymentsLastMonthResult] = await Promise.all([
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
  ]);

  const paymentsThisMonth = Number(paymentsThisMonthResult._sum.amount ?? 0);
  const paymentsLastMonth = Number(paymentsLastMonthResult._sum.amount ?? 0);
  const delta = paymentsThisMonth - paymentsLastMonth;
  const deltaPercent =
    paymentsLastMonth > 0
      ? Math.round((delta / paymentsLastMonth) * 100)
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
      thisMonth: paymentsThisMonth,
      lastMonth: paymentsLastMonth,
      delta,
      deltaPercent,
    },
  };
}
