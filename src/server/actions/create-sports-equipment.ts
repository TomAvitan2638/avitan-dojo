"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type CreateSportsEquipmentState = {
  error?: string;
  success?: boolean;
};

function generateNextCode(latestCode: string | null): string {
  if (!latestCode) return "001";
  const num = parseInt(latestCode, 10);
  return String(isNaN(num) ? 1 : num + 1).padStart(3, "0");
}

export async function createSportsEquipment(
  _prevState: CreateSportsEquipmentState | null,
  formData: FormData
): Promise<CreateSportsEquipmentState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const description = (formData.get("description") as string)?.trim();
  if (!description) {
    return { error: "יש להזין תיאור" };
  }

  const amountStr = (formData.get("amount") as string)?.trim();
  if (amountStr === undefined || amountStr === null || amountStr === "") {
    return { error: "יש להזין סכום" };
  }
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) {
    return { error: "סכום לא תקין" };
  }

  let latest = await prisma.sportsEquipment.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let code = generateNextCode(latest?.code ?? null);

  try {
    await prisma.sportsEquipment.create({
      data: { code, description, amount },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      latest = await prisma.sportsEquipment.findFirst({
        orderBy: { code: "desc" },
        select: { code: true },
      });
      code = generateNextCode(latest?.code ?? null);
      await prisma.sportsEquipment.create({
        data: { code, description, amount },
      });
    } else {
      throw err;
    }
  }

  revalidatePath("/dashboard/system-data");
  return { success: true };
}
