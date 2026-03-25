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

export type CreatePaymentState = {
  error?: string;
  success?: boolean;
  /** Internal: ensures each success triggers a re-render for the create dialog lifecycle */
  _ts?: number;
};

type MonthInput = { year: number; month: number };
type EquipmentItemInput = { code: string; quantity: number };

export async function createPayment(
  _prevState: CreatePaymentState | null,
  formData: FormData
): Promise<CreatePaymentState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const paymentType = formData.get("paymentType") as PaymentType | null;
  const studentId = (formData.get("studentId") as string)?.trim();
  const paymentDateStr = (formData.get("paymentDate") as string)?.trim();

  if (!paymentType || !studentId || !paymentDateStr) {
    return { error: "יש למלא את כל השדות הנדרשים" };
  }

  const validTypes: PaymentType[] = ["MONTHLY", "EQUIPMENT", "EXAM"];
  if (!validTypes.includes(paymentType)) {
    return { error: "סוג תשלום לא תקין" };
  }

  const paymentDate = parseDateOnlyFromForm(paymentDateStr);
  if (!paymentDate) {
    return { error: "תאריך תשלום לא תקין" };
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      ...(user.role === "INSTRUCTOR" && user.instructorId
        ? { memberships: { some: { group: { instructorId: user.instructorId } } } }
        : {}),
    },
    include: {
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { group: { include: { center: true } } },
      },
    },
  });

  if (!student) {
    return { error: "תלמיד לא נמצא או אין הרשאה" };
  }

  const activeMembership = student.memberships[0] ?? null;

  let studentIdentifierSnapshot = student.identifier;
  let studentNameSnapshot = `${student.firstName} ${student.lastName}`;
  let centerIdSnapshot: string | null = null;
  let centerNameSnapshot: string | null = null;
  let groupIdSnapshot: string | null = null;
  let groupNameSnapshot: string | null = null;

  if (activeMembership) {
    centerIdSnapshot = activeMembership.group.center.id;
    centerNameSnapshot = activeMembership.group.center.name;
    groupIdSnapshot = activeMembership.group.id;
    groupNameSnapshot = activeMembership.group.name;
  }

  if (paymentType === "MONTHLY") {
    if (!activeMembership) {
      return { error: "תשלום חודשי דורש מנוי פעיל לתלמיד" };
    }

    const monthlySubtype = formData.get("monthlySubtype") as MonthlyPaymentSubtype | null;
    if (!monthlySubtype || !["REGULAR", "CHECK", "WAIVER"].includes(monthlySubtype)) {
      return { error: "יש לבחור סוג תשלום חודשי" };
    }

    let amount = 0;
    let paymentMethod: PaymentMethod | null = null;
    let bankNumber: string | null = null;
    let checkNumber: string | null = null;
    let waiverReason: string | null = null;

    if (monthlySubtype === "WAIVER") {
      waiverReason = (formData.get("waiverReason") as string)?.trim() || null;
    } else if (monthlySubtype === "REGULAR") {
      const amountStr = (formData.get("amount") as string)?.trim();
      const parsed = parsePaymentAmount(amountStr);
      if (!parsed.ok) return { error: parsed.error };
      amount = parsed.value;
      const method = formData.get("paymentMethod") as PaymentMethod | null;
      if (!method || !["bit", "paybox", "cash", "bank_transfer"].includes(method)) {
        return { error: "אמצעי תשלום נדרש" };
      }
      paymentMethod = method;
    } else {
      const amountStr = (formData.get("amount") as string)?.trim();
      const parsed = parsePaymentAmount(amountStr);
      if (!parsed.ok) return { error: parsed.error };
      amount = parsed.value;
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

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentId,
          membershipId: activeMembership?.id ?? null,
          paymentType,
          paymentDate,
          amount,
          paymentMethod,
          monthlySubtype,
          bankNumber,
          checkNumber,
          waiverReason,
          studentIdentifierSnapshot,
          studentNameSnapshot,
          centerIdSnapshot,
          centerNameSnapshot,
          groupIdSnapshot,
          groupNameSnapshot,
        },
      });
      await tx.paymentMonth.createMany({
        data: uniqueMonths.map((m) => ({
          paymentId: payment.id,
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
      const payment = await tx.payment.create({
        data: {
          studentId,
          membershipId: activeMembership?.id ?? null,
          paymentType,
          paymentDate,
          amount,
          equipmentNotes,
          studentIdentifierSnapshot,
          studentNameSnapshot,
          centerIdSnapshot,
          centerNameSnapshot,
          groupIdSnapshot,
          groupNameSnapshot,
        },
      });
      await tx.paymentEquipmentItem.createMany({
        data: itemsWithSnapshot.map((i) => ({
          paymentId: payment.id,
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
    if (!examExists) {
      return { error: "סוג מבחן לא תקין" };
    }

    const examDateStr = (formData.get("examDate") as string)?.trim();
    const examDate = examDateStr ? parseDateOnlyFromForm(examDateStr) : null;
    if (!examDate) {
      return { error: "תאריך מבחן נדרש" };
    }

    await prisma.payment.create({
      data: {
        studentId,
        membershipId: activeMembership?.id ?? null,
        paymentType,
        paymentDate,
        amount,
        examCode,
        examDate,
        studentIdentifierSnapshot,
        studentNameSnapshot,
        centerIdSnapshot,
        centerNameSnapshot,
        groupIdSnapshot,
        groupNameSnapshot,
      },
    });
  }

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  return { success: true, _ts: Date.now() };
}
