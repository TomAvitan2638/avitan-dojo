"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadInstructorPhoto } from "@/server/utils/upload-instructor-photo";

export type CreateInstructorState = {
  error?: string;
  success?: boolean;
};

export async function createInstructor(
  _prevState: CreateInstructorState | null,
  formData: FormData
): Promise<CreateInstructorState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const birthDateStr = (formData.get("birthDate") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "שם פרטי ומשפחה נדרשים" };
  }

  const birthDate = birthDateStr ? new Date(birthDateStr) : null;
  if (birthDateStr && isNaN(birthDate!.getTime())) {
    return { error: "תאריך לידה לא תקין" };
  }

  let photoUrl: string | null = null;
  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    try {
      photoUrl = await uploadInstructorPhoto(photoFile);
    } catch (err) {
      console.error("[create-instructor] Upload failed:", err);
      if (err && typeof err === "object" && "cause" in err) {
        console.error("[create-instructor] Cause:", (err as { cause?: unknown }).cause);
      }
      return {
        error: err instanceof Error ? err.message : "שגיאה בהעלאת התמונה",
      };
    }
  }

  await prisma.instructor.create({
    data: {
      firstName,
      lastName,
      phone,
      email,
      city,
      address,
      birthDate,
      notes,
      photoUrl,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/instructors");
  return { success: true };
}
