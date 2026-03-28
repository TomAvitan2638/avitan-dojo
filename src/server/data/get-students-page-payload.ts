import { format } from "date-fns";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";
import type { StudentListRow } from "@/lib/student-list-filter";
import type {
  StudentsPagePayload,
  StudentsPageQueryScope,
  GroupOption,
} from "@/types/students-page";

export type {
  StudentsPagePayload,
  StudentsPageQueryScope,
} from "@/types/students-page";

function buildStudentsListWhere(user: {
  role: string;
  instructorId: string | null;
}) {
  return user.role === "INSTRUCTOR" && user.instructorId
    ? {
        memberships: {
          some: { group: { instructorId: user.instructorId } },
        },
      }
    : {};
}

/**
 * Same Prisma queries + mapping as the Students tab list.
 * Used by GET /api/dashboard/students and any server callers.
 */
export async function getStudentsPagePayload(
  user: CurrentUser
): Promise<StudentsPagePayload> {
  const whereClause = buildStudentsListWhere(user);

  const [students, centers, groups, beltLevels] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        identifier: true,
        studentNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        photoUrl: true,
        memberships: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            startDate: true,
            endDate: true,
            group: {
              select: {
                id: true,
                centerId: true,
                name: true,
                center: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.center.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, centerId: true },
    }),
    prisma.beltLevel.findMany({
      orderBy: { orderNumber: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const studentsForTable: StudentListRow[] = students.map((s) => {
    const activeMembership = s.memberships[0] ?? null;
    return {
      id: s.id,
      identifier: s.identifier,
      studentNumber: s.studentNumber,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName} ${s.lastName}`,
      status: s.status,
      photoUrl: s.photoUrl,
      centerName: activeMembership?.group.center.name ?? null,
      groupName: activeMembership?.group.name ?? null,
      registrationDate: activeMembership
        ? format(activeMembership.startDate, "dd/MM/yyyy")
        : null,
      endDate: activeMembership?.endDate
        ? format(activeMembership.endDate, "dd/MM/yyyy")
        : null,
      registrationDateRaw: activeMembership?.startDate ?? null,
      endDateRaw: activeMembership?.endDate ?? null,
    };
  });

  const groupsForSelect: GroupOption[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    centerId: g.centerId,
  }));

  return {
    students: studentsForTable,
    centers,
    groups: groupsForSelect,
    beltLevels,
    totalStudents: studentsForTable.length,
  };
}

export { getStudentsPageScope } from "@/lib/students-page-scope";
