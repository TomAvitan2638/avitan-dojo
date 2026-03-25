import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentsPageClient } from "./students-page-client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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

export default async function StudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

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

  const studentsForTable = students.map((s) => {
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

  const groupsForSelect = groups.map((g) => ({
    id: g.id,
    name: g.name,
    centerId: g.centerId,
  }));

  return (
    <div className="min-h-screen">
      <Header title="תלמידים" />
      <div className="p-6">
        <StudentsPageClient
          students={studentsForTable}
          centers={centers}
          groups={groupsForSelect}
          beltLevels={beltLevels}
          totalStudents={studentsForTable.length}
        />
      </div>
    </div>
  );
}
