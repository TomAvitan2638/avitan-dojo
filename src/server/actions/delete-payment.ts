"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeletePaymentState = {
  error?: string;
  success?: boolean;
};

export async function deletePayment(paymentId: string): Promise<DeletePaymentState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const existing = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      paymentType: { not: null },
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
  });

  if (!existing) {
    return { error: "תשלום לא נמצא או אין הרשאה" };
  }

  await prisma.payment.delete({
    where: { id: paymentId },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  return { success: true };
}
