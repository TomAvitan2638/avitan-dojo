import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentEditForm } from "../student-edit-form";
import { format } from "date-fns";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: {
      id,
      ...(user.role === "INSTRUCTOR" && user.instructorId
        ? {
            memberships: {
              some: { group: { instructorId: user.instructorId } },
            },
          }
        : {}),
    },
    include: {
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { group: { include: { center: true } } },
      },
      beltHistory: {
        include: { beltLevel: true },
        orderBy: { promotionDate: "desc" },
        take: 1,
      },
    },
  });

  if (!student) redirect("/dashboard/students");

  const activeMembership = student.memberships[0] ?? null;
  const latestBelt = student.beltHistory[0] ?? null;

  const [centers, groups, beltLevels] = await Promise.all([
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

  return (
    <div className="min-h-screen">
      <Header
        title={`עריכת תלמיד: ${student.firstName} ${student.lastName}`}
        backHref="/dashboard/students"
        backLabel="חזרה לתלמידים"
      />
      <div className="p-6">
        <StudentEditForm
          student={{
            id: student.id,
            identifier: student.identifier,
            studentNumber: student.studentNumber?.toString() ?? "",
            firstName: student.firstName,
            lastName: student.lastName,
            gender: student.gender ?? "",
            birthDate: student.birthDate
              ? format(student.birthDate, "yyyy-MM-dd")
              : "",
            phone: student.phone ?? "",
            mobilePhone: student.mobilePhone ?? "",
            email: student.email ?? "",
            city: student.city ?? "",
            street: student.street ?? "",
            postalCode: student.postalCode ?? "",
            weight: student.weight?.toString() ?? "",
            centerId: activeMembership?.group.centerId ?? "",
            groupId: activeMembership?.group.id ?? "",
            registrationDate: activeMembership
              ? format(activeMembership.startDate, "yyyy-MM-dd")
              : "",
            endDate: activeMembership?.endDate
              ? format(activeMembership.endDate, "yyyy-MM-dd")
              : "",
            parentName: student.parentName ?? "",
            parentPhone: student.parentPhone ?? "",
            emergencyDetails: student.emergencyDetails ?? "",
            beltLevelId: latestBelt?.beltLevelId ?? "",
            beltDate: latestBelt
              ? format(latestBelt.promotionDate, "yyyy-MM-dd")
              : "",
            beltCertificateNumber: latestBelt?.certificateNumber ?? "",
            hasMedicalApproval: student.hasMedicalApproval ?? false,
            photoUrl: student.photoUrl,
          }}
          centers={centers}
          groups={groups}
          beltLevels={beltLevels}
        />
      </div>
    </div>
  );
}
