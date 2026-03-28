import type { CurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TRAINING_DAY_LABELS } from "@/lib/training-days";
import type { GroupsPagePayload } from "@/types/groups-page";
import { format } from "date-fns";

export { getGroupsPageScope } from "@/lib/groups-page-scope";

/**
 * Groups tab payload. Used by GET /api/dashboard/groups (single source for list + form selects).
 */
export async function getGroupsPagePayload(
  _user: CurrentUser
): Promise<GroupsPagePayload> {
  const [groups, activeMemberships, centers, instructors] = await Promise.all([
    prisma.group.findMany({
      select: {
        id: true,
        name: true,
        notes: true,
        center: { select: { name: true } },
        instructor: { select: { firstName: true, lastName: true } },
        schedules: {
          orderBy: { trainingDay: "asc" },
          select: { trainingDay: true, startTime: true, endTime: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.studentMembership.findMany({
      where: { status: "active" },
      select: {
        groupId: true,
        student: { select: { gender: true } },
      },
    }),
    prisma.center.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.instructor.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const countsByGroup = activeMemberships.reduce(
    (acc, m) => {
      const gid = m.groupId;
      if (!acc[gid]) {
        acc[gid] = { total: 0, boys: 0, girls: 0 };
      }
      acc[gid].total += 1;
      const gender = m.student?.gender ?? null;
      if (gender === "זכר") acc[gid].boys += 1;
      else if (gender === "נקבה") acc[gid].girls += 1;
      return acc;
    },
    {} as Record<string, { total: number; boys: number; girls: number }>
  );

  const groupsForList = groups.map((g) => {
    const counts = countsByGroup[g.id] ?? { total: 0, boys: 0, girls: 0 };
    return {
      id: g.id,
      name: g.name,
      centerName: g.center.name,
      instructorName: `${g.instructor.firstName} ${g.instructor.lastName}`,
      notes: g.notes ?? null,
      studentsCount: counts.total,
      boysCount: counts.boys,
      girlsCount: counts.girls,
      scheduleSummary: g.schedules.map((s) => ({
        day: TRAINING_DAY_LABELS[s.trainingDay],
        time: `${format(s.startTime, "HH:mm")}-${format(s.endTime, "HH:mm")}`,
      })),
    };
  });

  const instructorsForSelect = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));

  return {
    groups: groupsForList,
    centers,
    instructors: instructorsForSelect,
  };
}
