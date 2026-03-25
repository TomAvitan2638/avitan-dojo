"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type UpdateCenterState = {
  error?: string;
};

export async function updateCenter(
  centerId: string,
  _prevState: UpdateCenterState | null,
  formData: FormData
): Promise<UpdateCenterState> {
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

  await prisma.center.update({
    where: { id: centerId },
    data: {
      name,
      instructorId: instructorId || null,
      price: price ?? null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/centers");
  revalidatePath(`/dashboard/centers/${centerId}`);
  redirect(`/dashboard/centers/${centerId}`);
}
