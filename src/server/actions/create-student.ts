"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadStudentPhoto } from "@/server/utils/upload-student-photo";
import { computeDerivedStudentStatus } from "@/lib/student-status";

export type CreateStudentState = {
  error?: string;
  success?: boolean;
};

export async function createStudent(
  _prevState: CreateStudentState | null,
  formData: FormData
): Promise<CreateStudentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "לא מאומת" };

  const identifier = (formData.get("identifier") as string)?.trim();
  const studentNumberStr = (formData.get("studentNumber") as string)?.trim() || null;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const gender = (formData.get("gender") as string)?.trim();
  const birthDateStr = (formData.get("birthDate") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const mobilePhone = (formData.get("mobilePhone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const street = (formData.get("street") as string)?.trim() || null;
  const postalCode = (formData.get("postalCode") as string)?.trim() || null;
  const weightStr = (formData.get("weight") as string)?.trim() || null;
  const centerId = (formData.get("centerId") as string)?.trim();
  const groupId = (formData.get("groupId") as string)?.trim();
  const registrationDateStr = (formData.get("registrationDate") as string)?.trim();
  const endDateStr = (formData.get("endDate") as string)?.trim();
  const parentName = (formData.get("parentName") as string)?.trim() || null;
  const parentPhone = (formData.get("parentPhone") as string)?.trim() || null;
  const emergencyDetails = (formData.get("emergencyDetails") as string)?.trim() || null;
  const beltLevelId = (formData.get("beltLevelId") as string)?.trim() || null;
  const beltDateStr = (formData.get("beltDate") as string)?.trim() || null;
  const beltCertificateNumber = (formData.get("beltCertificateNumber") as string)?.trim() || null;
  const hasMedicalApproval = formData.get("hasMedicalApproval") === "on" || formData.get("hasMedicalApproval") === "true";

  if (!identifier) return { error: "ת״ז נדרש" };
  if (!firstName) return { error: "שם פרטי נדרש" };
  if (!lastName) return { error: "שם משפחה נדרש" };
  if (!gender) return { error: "מין נדרש" };
  if (!centerId) return { error: "מרכז נדרש" };
  if (!groupId) return { error: "קבוצה נדרש" };
  if (!registrationDateStr) return { error: "תאריך הרשמה נדרש" };

  let studentNumber: number | null = null;
  if (studentNumberStr) {
    const parsed = parseInt(studentNumberStr, 10);
    if (isNaN(parsed) || parsed < 0) {
      return { error: "מספר תלמיד חייב להיות מספר חיובי" };
    }
    studentNumber = parsed;
  }

  const [existingByIdentifier, existingByNumber, group] = await Promise.all([
    prisma.student.findUnique({ where: { identifier } }),
    studentNumber != null
      ? prisma.student.findUnique({ where: { studentNumber } })
      : Promise.resolve(null),
    prisma.group.findUnique({ where: { id: groupId }, select: { centerId: true } }),
  ]);

  if (existingByIdentifier) {
    return { error: "ת״ז כבר קיים במערכת" };
  }
  if (existingByNumber) {
    return { error: "מספר תלמיד כבר קיים במערכת" };
  }
  if (!group) return { error: "קבוצה לא נמצאה" };
  if (group.centerId !== centerId) {
    return { error: "הקבוצה הנבחרת אינה שייכת למרכז הנבחר" };
  }

  if (beltLevelId && !beltDateStr) {
    return { error: "כאשר נבחרה דרגה, תאריך דרגה נדרש" };
  }

  let birthDate: Date | null = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      return { error: "תאריך לידה לא תקין" };
    }
  }

  const registrationDate = new Date(registrationDateStr);
  if (isNaN(registrationDate.getTime())) {
    return { error: "תאריך הרשמה לא תקין" };
  }

  let endDate: Date | null = null;
  if (endDateStr) {
    const parsed = new Date(endDateStr);
    if (isNaN(parsed.getTime())) return { error: "תאריך סיום לא תקין" };
    endDate = parsed;
  }

  let weight: number | null = null;
  if (weightStr) {
    const parsed = parseFloat(weightStr);
    if (isNaN(parsed) || parsed < 0) return { error: "משקל לא תקין" };
    weight = Math.round(parsed);
  }

  let beltDate: Date | null = null;
  if (beltDateStr) {
    beltDate = new Date(beltDateStr);
    if (isNaN(beltDate.getTime())) return { error: "תאריך דרגה לא תקין" };
  }

  let photoUrl: string | null = null;
  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    try {
      photoUrl = await uploadStudentPhoto(photoFile);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "שגיאה בהעלאת התמונה",
      };
    }
  }

  const derivedStatus = computeDerivedStudentStatus({
    group: { centerId: group.centerId },
    endDate,
    status: "active",
  });

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        identifier,
        studentNumber,
        firstName,
        lastName,
        birthDate,
        gender,
        phone,
        mobilePhone,
        email,
        city,
        street,
        postalCode,
        weight,
        parentName,
        parentPhone,
        emergencyDetails,
        hasMedicalApproval,
        photoUrl,
        status: derivedStatus,
      },
    });

    await tx.studentMembership.create({
      data: {
        studentId: student.id,
        groupId,
        startDate: registrationDate,
        endDate,
        status: "active",
      },
    });

    if (beltLevelId && beltDate) {
      await tx.studentBeltHistory.create({
        data: {
          studentId: student.id,
          beltLevelId,
          promotionDate: beltDate,
          certificateNumber: beltCertificateNumber || undefined,
        },
      });
    }
  });

  revalidatePath("/dashboard/students");
  return { success: true };
}
