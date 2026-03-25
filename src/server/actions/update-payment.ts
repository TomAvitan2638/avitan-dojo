"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type {
  PaymentType,
  MonthlyPaymentSubtype,
  PaymentMethod,
} from "@prisma/client";
import { parsePaymentAmount } from "@/lib/payment-input";
import { parseDateOnlyFromForm } from "@/lib/date-only";

export type UpdatePaymentState = {
  error?: string;
  success?: boolean;
};

type MonthInput = { year: number; month: number };
type EquipmentItemInput = { code: string; quantity: number };

export async function updatePayment(
  paymentId: string,
  formData: FormData
): Promise<UpdatePaymentState> {
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
    include: {
      student: {
        select: {
          id: true,
          memberships: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!existing || !existing.paymentType) {
    return { error: "תשלום לא נמצא או אין הרשאה" };
  }

  const paymentType = existing.paymentType;
  const paymentDateStr = (formData.get("paymentDate") as string)?.trim();
  if (!paymentDateStr) return { error: "תאריך תשלום נדרש" };
  const paymentDate = parseDateOnlyFromForm(paymentDateStr);
  if (!paymentDate) return { error: "תאריך תשלום לא תקין" };

  if (paymentType === "MONTHLY") {
    const monthlySubtype = formData.get("monthlySubtype") as MonthlyPaymentSubtype | null;
    if (!monthlySubtype || !["REGULAR", "CHECK", "WAIVER"].includes(monthlySubtype)) {
      return { error: "יש לבחור סוג תשלום חודשי" };
    }

    const amountStr = (formData.get("amount") as string)?.trim();
    let amount = 0;
    if (monthlySubtype === "WAIVER") {
      amount = 0;
    } else {
      const parsed = parsePaymentAmount(amountStr);
      if (!parsed.ok) return { error: parsed.error };
      amount = parsed.value;
    }

    let paymentMethod: PaymentMethod | null = null;
    let bankNumber: string | null = null;
    let checkNumber: string | null = null;
    let waiverReason: string | null = null;

    if (monthlySubtype === "WAIVER") {
      waiverReason = (formData.get("waiverReason") as string)?.trim() || null;
    } else if (monthlySubtype === "REGULAR") {
      const method = formData.get("paymentMethod") as PaymentMethod | null;
      if (!method || !["bit", "paybox", "cash", "bank_transfer"].includes(method)) {
        return { error: "אמצעי תשלום נדרש" };
      }
      paymentMethod = method;
    } else {
      bankNumber = (formData.get("bankNumber") as string)?.trim() || null;
      checkNumber = (formData.get("checkNumber") as string)?.trim() || null;
      if (!bankNumber || !checkNumber) {
        return { error: "מספר בנק ומספר צ׳ק נדרשים" };
      }
    }

    const monthsStr = (formData.get("months") as string)?.trim();
    if (!monthsStr) return { error: "יש לבחור לפחות חודש אחד" };
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

    const activeMembership = existing.student.memberships[0] ?? null;
    if (!activeMembership) {
      return { error: "תשלום חודשי דורש מנוי פעיל לתלמיד" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          paymentDate,
          amount,
          monthlySubtype,
          paymentMethod,
          bankNumber,
          checkNumber,
          waiverReason,
        },
      });
      await tx.paymentMonth.deleteMany({ where: { paymentId } });
      await tx.paymentMonth.createMany({
        data: uniqueMonths.map((m) => ({
          paymentId,
          year: m.year,
          month: m.month,
        })),
      });
    });
  } else if (paymentType === "EQUIPMENT") {
    const amountStr = (formData.get("amount") as string)?.trim();
    const amountParsed = parsePaymentAmount(amountStr);
    if (!amountParsed.ok) return { error: amountParsed.error };
    const amount = amountParsed.value;
    const equipmentNotes = (formData.get("equipmentNotes") as string)?.trim() || null;
    const itemsStr = (formData.get("equipmentItems") as string)?.trim();
    if (!itemsStr) return { error: "יש לבחור לפחות פריט ציוד אחד" };
    let items: EquipmentItemInput[];
    try {
      items = JSON.parse(itemsStr) as EquipmentItemInput[];
    } catch {
      return { error: "פורמט פריטי ציוד לא תקין" };
    }
    if (!Array.isArray(items) || items.length === 0) {
      return { error: "יש לבחור לפחות פריט ציוד אחד" };
    }

    const codes = [...new Set(items.map((i) => i.code))];
    const catalogItems = await prisma.sportsEquipment.findMany({
      where: { code: { in: codes } },
      select: { code: true, amount: true },
    });
    const catalogByCode = new Map(catalogItems.map((e) => [e.code, e]));
    const missing = codes.filter((c) => !catalogByCode.has(c));
    if (missing.length > 0) {
      return { error: `קודי ציוד לא תקינים: ${missing.join(", ")}` };
    }

    const itemsWithSnapshot = items.map((i) => {
      const catalog = catalogByCode.get(i.code)!;
      const unitAmountSnapshot = Number(catalog.amount ?? 0);
      return {
        equipmentCode: i.code,
        quantity: Math.max(1, Math.floor(i.quantity)),
        unitAmountSnapshot,
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          paymentDate,
          amount,
          equipmentNotes,
        },
      });
      await tx.paymentEquipmentItem.deleteMany({ where: { paymentId } });
      await tx.paymentEquipmentItem.createMany({
        data: itemsWithSnapshot.map((i) => ({
          paymentId,
          equipmentCode: i.equipmentCode,
          quantity: i.quantity,
          unitAmountSnapshot: i.unitAmountSnapshot,
        })),
      });
    });
  } else {
    const amountStr = (formData.get("amount") as string)?.trim();
    const amountParsed = parsePaymentAmount(amountStr);
    if (!amountParsed.ok) return { error: amountParsed.error };
    const amount = amountParsed.value;

    const examCode = (formData.get("examCode") as string)?.trim();
    if (!examCode) return { error: "סוג מבחן נדרש" };

    const examExists = await prisma.exam.findUnique({
      where: { code: examCode },
    });
    if (!examExists) return { error: "סוג מבחן לא תקין" };

    const examDateStr = (formData.get("examDate") as string)?.trim();
    const examDate = examDateStr ? parseDateOnlyFromForm(examDateStr) : null;
    if (!examDate) return { error: "תאריך מבחן נדרש" };

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentDate,
        amount,
        examCode,
        examDate,
      },
    });
  }

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  return { success: true };
}
