"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type DeleteInstructorPaymentState = {
  error?: string;
  success?: boolean;
};

export async function deleteInstructorPayment(
  paymentId: string
): Promise<DeleteInstructorPaymentState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  if (user.role !== "ADMIN") {
    return { error: "אין הרשאה" };
  }

  const existing = await prisma.instructorPayment.findFirst({
    where: { id: paymentId },
    select: { id: true },
  });

  if (!existing) {
    return { error: "תשלום לא נמצא" };
  }

  await prisma.instructorPayment.delete({
    where: { id: paymentId },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  return { success: true };
}
