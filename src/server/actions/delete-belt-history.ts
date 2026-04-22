"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeleteBeltHistoryState = {
  error?: string;
  success?: boolean;
};

/**
 * Hard-deletes a single `StudentBeltHistory` row by id.
 *
 * - Scoped by role: ADMIN can delete any row; INSTRUCTOR can only delete rows
 *   whose student has a membership in one of their groups (matches the
 *   instructor scope used in `deletePayment` and `getStudentForModal`).
 * - Intentionally independent of `update-student.ts` "clear current belt"
 *   logic — this action only ever touches the exact row passed by `id`.
 */
export async function deleteBeltHistory(
  beltHistoryId: string,
  expectedStudentId?: string
): Promise<DeleteBeltHistoryState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  if (!beltHistoryId || typeof beltHistoryId !== "string") {
    return { error: "מזהה רשומת דרגה חסר" };
  }

  const existing = await prisma.studentBeltHistory.findFirst({
    where: {
      id: beltHistoryId,
      ...(user.role === "INSTRUCTOR" && user.instructorId
        ? {
            student: {
              memberships: {
                some: { group: { instructorId: user.instructorId } },
              },
            },
          }
        : {}),
    },
    select: { id: true, studentId: true },
  });

  if (!existing) {
    return { error: "רשומת הדרגה לא נמצאה או אין הרשאה" };
  }

  if (expectedStudentId && existing.studentId !== expectedStudentId) {
    return { error: "רשומת הדרגה אינה שייכת לתלמיד המבוקש" };
  }

  await prisma.studentBeltHistory.delete({
    where: { id: existing.id },
  });

  revalidatePath("/dashboard/belts");
  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${existing.studentId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
