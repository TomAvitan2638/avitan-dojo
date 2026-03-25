"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeleteInstructorResult = {
  success?: boolean;
  error?: string;
};

export async function deleteInstructor(
  instructorId: string
): Promise<DeleteInstructorResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    include: {
      _count: { select: { centers: true, groups: true } },
    },
  });

  if (!instructor) {
    return { error: "המאמן לא נמצא" };
  }

  if (instructor._count.centers > 0 || instructor._count.groups > 0) {
    return {
      error:
        "לא ניתן למחוק את המאמן כי הוא משויך למרכזים או לקבוצות במערכת. יש להסיר קודם את השיוכים ורק לאחר מכן למחוק.",
    };
  }

  await prisma.instructor.delete({
    where: { id: instructorId },
  });

  revalidatePath("/dashboard/instructors");
  revalidatePath(`/dashboard/instructors/${instructorId}`);

  return { success: true };
}
