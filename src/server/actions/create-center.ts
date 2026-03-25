"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type CreateCenterState = {
  error?: string;
  success?: boolean;
};

export async function createCenter(
  _prevState: CreateCenterState | null,
  formData: FormData
): Promise<CreateCenterState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const name = (formData.get("name") as string)?.trim();
  const instructorId = (formData.get("instructorId") as string)?.trim() || null;
  const priceStr = (formData.get("price") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { error: "שם המרכז נדרש" };
  }

  const price = priceStr ? parseFloat(priceStr) : null;
  if (priceStr && (isNaN(price!) || price! < 0)) {
    return { error: "מחיר לא תקין" };
  }

  await prisma.center.create({
    data: {
      name,
      instructorId: instructorId || undefined,
      price: price ?? undefined,
      notes: notes || undefined,
    },
  });

  revalidatePath("/dashboard/centers");
  return { success: true };
}
