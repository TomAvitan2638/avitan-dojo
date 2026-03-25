"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeleteGroupResult = {
  success?: boolean;
  error?: string;
};

export async function deleteGroup(groupId: string): Promise<DeleteGroupResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { memberships: true } },
    },
  });

  if (!group) {
    return { error: "הקבוצה לא נמצאה" };
  }

  if (group._count.memberships > 0) {
    return {
      error:
        "לא ניתן למחוק את הקבוצה כי קיימים תלמידים המשויכים אליה במערכת. יש להסיר קודם את השיוך של התלמידים ורק לאחר מכן למחוק את הקבוצה.",
    };
  }

  await prisma.group.delete({
    where: { id: groupId },
  });

  revalidatePath("/dashboard/groups");
  revalidatePath(`/dashboard/groups/${groupId}`);

  return { success: true };
}
