"use server";

import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { StudentForModal } from "@/components/students/student-details-modal";

function mapDbStudentToModal(
  s: {
    id: string;
    identifier: string;
    studentNumber: number | null;
    firstName: string;
    lastName: string;
    gender: string | null;
    birthDate: Date | null;
    phone: string | null;
    mobilePhone: string | null;
    email: string | null;
    city: string | null;
    street: string | null;
    postalCode: string | null;
    weight: number | null;
    parentName: string | null;
    parentPhone: string | null;
    emergencyDetails: string | null;
    hasMedicalApproval: boolean;
    photoUrl: string | null;
    status: string;
    memberships: {
      startDate: Date;
      endDate: Date | null;
      group: {
        id: string;
        centerId: string;
        name: string;
        center: { name: string };
      };
    }[];
    beltHistory: {
      id: string;
      beltLevelId: string;
      promotionDate: Date;
      certificateNumber: string | null;
      createdAt: Date;
      beltLevel: { name: string };
    }[];
  }
): StudentForModal {
  const activeMembership = s.memberships[0] ?? null;
  const latestBelt = s.beltHistory?.[0] ?? null;

  return {
    id: s.id,
    identifier: s.identifier,
    studentNumber: s.studentNumber,
    firstName: s.firstName,
    lastName: s.lastName,
    status: s.status,
    gender: s.gender,
    birthDate: s.birthDate ? format(s.birthDate, "dd/MM/yyyy") : null,
    birthDateRaw: s.birthDate ? s.birthDate.toISOString() : null,
    phone: s.phone,
    mobilePhone: s.mobilePhone,
    email: s.email,
    city: s.city,
    street: s.street,
    postalCode: s.postalCode,
    weight: s.weight,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    emergencyDetails: s.emergencyDetails,
    hasMedicalApproval: s.hasMedicalApproval,
    photoUrl: s.photoUrl,
    centerName: activeMembership?.group.center.name ?? null,
    groupName: activeMembership?.group.name ?? null,
    centerId: activeMembership?.group.centerId ?? null,
    groupId: activeMembership?.group.id ?? null,
    registrationDate: activeMembership
      ? format(activeMembership.startDate, "dd/MM/yyyy")
      : null,
    endDate: activeMembership?.endDate
      ? format(activeMembership.endDate, "dd/MM/yyyy")
      : null,
    registrationDateRaw: activeMembership?.startDate ?? null,
    endDateRaw: activeMembership?.endDate ?? null,
    beltLevelId: latestBelt?.beltLevelId ?? null,
    beltName: latestBelt?.beltLevel.name ?? null,
    beltDate: latestBelt
      ? format(latestBelt.promotionDate, "dd/MM/yyyy")
      : null,
    beltDateRaw: latestBelt?.promotionDate ?? null,
    beltCertificateNumber: latestBelt?.certificateNumber ?? null,
    beltHistory: s.beltHistory.map((h) => ({
      id: h.id,
      beltName: h.beltLevel.name,
      promotionDate: format(h.promotionDate, "dd/MM/yyyy"),
      createdAt: format(h.createdAt, "dd/MM/yyyy HH:mm"),
      certificateNumber: h.certificateNumber ?? null,
    })),
  };
}

/**
 * Full student payload for the details modal / edit form.
 * Same instructor scope as the Students list and detail page.
 */
export async function getStudentForModal(
  studentId: string
): Promise<{ ok: true; student: StudentForModal } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "לא מחובר" };
  }

  const whereBase = {
    id: studentId,
    ...(user.role === "INSTRUCTOR" && user.instructorId
      ? {
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : {}),
  };

  const student = await prisma.student.findFirst({
    where: whereBase,
    select: {
      id: true,
      identifier: true,
      studentNumber: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      gender: true,
      phone: true,
      mobilePhone: true,
      email: true,
      city: true,
      street: true,
      postalCode: true,
      weight: true,
      parentName: true,
      parentPhone: true,
      emergencyDetails: true,
      hasMedicalApproval: true,
      photoUrl: true,
      status: true,
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
      beltHistory: {
        orderBy: { promotionDate: "desc" },
        select: {
          id: true,
          beltLevelId: true,
          promotionDate: true,
          certificateNumber: true,
          createdAt: true,
          beltLevel: { select: { name: true } },
        },
      },
    },
  });

  if (!student) {
    return { ok: false, error: "תלמיד לא נמצא" };
  }

  return { ok: true, student: mapDbStudentToModal(student) };
}
