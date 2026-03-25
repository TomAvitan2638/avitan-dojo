"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type UpdateExamResult = {
  success?: boolean;
  error?: string;
};

export async function updateExam(
  id: string,
  description: string,
  amountStr: string
): Promise<UpdateExamResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trimmed = description?.trim();
  if (!trimmed) {
    return { error: "יש להזין תיאור" };
  }

  const amt = amountStr?.trim();
  if (amt === undefined || amt === null || amt === "") {
    return { error: "יש להזין סכום" };
  }
  const amount = parseFloat(amt);
  if (isNaN(amount) || amount < 0) {
    return { error: "סכום לא תקין" };
  }

  await prisma.exam.update({
    where: { id },
    data: { description: trimmed, amount },
  });

  revalidatePath("/dashboard/system-data");
  return { success: true };
}
