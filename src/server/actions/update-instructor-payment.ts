"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseDateOnlyFromForm } from "@/lib/date-only";
import { parsePaymentAmount } from "@/lib/payment-input";

export type UpdateInstructorPaymentState = {
  error?: string;
  success?: boolean;
  _ts?: number;
};

type MonthInput = { year: number; month: number };

export async function updateInstructorPayment(
  paymentId: string,
  _prev: UpdateInstructorPaymentState | null,
  formData: FormData
): Promise<UpdateInstructorPaymentState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  if (user.role !== "ADMIN") {
    return { error: "אין הרשאה" };
  }

  const amountStr = (formData.get("amount") as string)?.trim();
  const paymentDateStr = (formData.get("paymentDate") as string)?.trim();
  const monthsStr = (formData.get("months") as string)?.trim();
  const notesRaw = (formData.get("notes") as string)?.trim();

  if (!amountStr || !paymentDateStr) {
    return { error: "יש למלא את כל השדות הנדרשים" };
  }

  const amountParsed = parsePaymentAmount(amountStr);
  if (!amountParsed.ok) {
    return { error: amountParsed.error };
  }

  const paymentDate = parseDateOnlyFromForm(paymentDateStr);
  if (!paymentDate) {
    return { error: "תאריך תשלום לא תקין" };
  }

  if (!monthsStr) {
    return { error: "יש לבחור לפחות חודש אחד" };
  }

  let months: MonthInput[];
  try {
    months = JSON.parse(monthsStr) as MonthInput[];
  } catch {
    return { error: "פורמט חודשים לא תקין" };
  }
  if (!Array.isArray(months) || months.length === 0) {
    return { error: "יש לבחור לפחות חודש אחד" };
  }

  const uniqueMonths = Array.from(
    new Map(months.map((m) => [`${m.year}-${m.month}`, m])).values()
  );
  if (uniqueMonths.length < months.length) {
    return { error: "לא ניתן לבחור את אותו חודש יותר מפעם אחת" };
  }

  for (const m of uniqueMonths) {
    if (
      !Number.isFinite(m.year) ||
      m.year < 1970 ||
      m.year > 2100 ||
      !Number.isFinite(m.month) ||
      m.month < 1 ||
      m.month > 12
    ) {
      return { error: "חודש/שנה לכיסוי לא תקינים" };
    }
  }

  const existing = await prisma.instructorPayment.findFirst({
    where: { id: paymentId },
    include: {
      instructor: { select: { id: true, isActive: true } },
    },
  });

  if (!existing || !existing.instructor.isActive) {
    return { error: "תשלום לא נמצא או המאמן אינו פעיל" };
  }

  const instructorId = existing.instructorId;
  const sorted = [...uniqueMonths].sort(
    (a, b) => a.year - b.year || a.month - b.month
  );

  const notes = notesRaw ? notesRaw : null;

  for (const m of sorted) {
    const conflict = await prisma.instructorPaymentMonth.findFirst({
      where: {
        instructorId,
        year: m.year,
        month: m.month,
        instructorPaymentId: { not: paymentId },
      },
      select: { id: true },
    });
    if (conflict) {
      return {
        error:
          "אחד מהחודשים שנבחרו כבר מכוסה בתשלום אחר לאותו מאמן",
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.instructorPayment.update({
        where: { id: paymentId },
        data: {
          amount: amountParsed.value,
          paymentDate,
          notes,
        },
      });
      await tx.instructorPaymentMonth.deleteMany({
        where: { instructorPaymentId: paymentId },
      });
      await tx.instructorPaymentMonth.createMany({
        data: sorted.map((m) => ({
          instructorPaymentId: paymentId,
          instructorId,
          year: m.year,
          month: m.month,
        })),
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error:
          "כבר קיים כיסוי רשום לאותו מאמן באחד מהחודשים שנבחרו (שנה וחודש)",
      };
    }
    throw e;
  }

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  return { success: true, _ts: Date.now() };
}
