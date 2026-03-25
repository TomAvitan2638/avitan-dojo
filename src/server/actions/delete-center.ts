"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeleteCenterResult = {
  success?: boolean;
  error?: string;
};

export async function deleteCenter(centerId: string): Promise<DeleteCenterResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const center = await prisma.center.findUnique({
    where: { id: centerId },
    include: {
      _count: { select: { groups: true } },
    },
  });

  if (!center) {
    return { error: "המרכז לא נמצא" };
  }

  if (center._count.groups > 0) {
    return {
      error:
        "לא ניתן למחוק את המרכז כי קיימות קבוצות המשויכות אליו במערכת. יש להסיר קודם את השיוך של הקבוצות ורק לאחר מכן למחוק את המרכז.",
    };
  }

  await prisma.center.delete({
    where: { id: centerId },
  });

  revalidatePath("/dashboard/centers");
  revalidatePath(`/dashboard/centers/${centerId}`);

  return { success: true };
}
