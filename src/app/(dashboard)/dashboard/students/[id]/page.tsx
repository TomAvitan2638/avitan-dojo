import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentDetailsClient } from "./student-details-client";
import { format } from "date-fns";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetailPage({ params }: Props) {
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

  return (
    <div className="min-h-screen">
      <Header
        title={`${student.firstName} ${student.lastName}`}
        backHref="/dashboard/students"
        backLabel="חזרה לתלמידים"
      />
      <div className="p-6">
        <StudentDetailsClient
          student={{
            id: student.id,
            identifier: student.identifier,
            status: student.status,
            studentNumber: student.studentNumber,
            firstName: student.firstName,
            lastName: student.lastName,
            gender: student.gender,
            birthDate: student.birthDate
              ? format(student.birthDate, "dd/MM/yyyy")
              : null,
            registrationDate: activeMembership
              ? format(activeMembership.startDate, "dd/MM/yyyy")
              : null,
            endDate: activeMembership?.endDate
              ? format(activeMembership.endDate, "dd/MM/yyyy")
              : null,
            centerName: activeMembership?.group.center.name ?? null,
            groupName: activeMembership?.group.name ?? null,
            phone: student.phone,
            mobilePhone: student.mobilePhone,
            email: student.email,
            city: student.city,
            street: student.street,
            postalCode: student.postalCode,
            weight: student.weight,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            emergencyDetails: student.emergencyDetails,
            hasMedicalApproval: student.hasMedicalApproval,
            beltName: latestBelt?.beltLevel.name ?? null,
            beltDate: latestBelt
              ? format(latestBelt.promotionDate, "dd/MM/yyyy")
              : null,
            beltCertificateNumber: latestBelt?.certificateNumber ?? null,
            photoUrl: student.photoUrl,
          }}
        />
      </div>
    </div>
  );
}
