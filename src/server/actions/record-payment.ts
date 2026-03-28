"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PaymentMethod } from "@prisma/client";
import { PAYMENT_METHODS_FOR_REGULAR } from "@/lib/payment-types";
import { parsePaymentAmount } from "@/lib/payment-input";

export type RecordPaymentState = {
  error?: string;
};

/**
 * Records a MONTHLY REGULAR payment for a membership and optionally updates the next due date.
 * Aligned with the main Payments module: creates valid payment rows with snapshots and PaymentMonth.
 * Role-based: Admin can access all; Instructor only their groups.
 */
export async function recordPayment(
  _prevState: RecordPaymentState | null,
  formData: FormData
): Promise<RecordPaymentState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const membershipId = formData.get("membershipId") as string;
  const studentId = formData.get("studentId") as string;
  const amountStr = formData.get("amount") as string;
  const paymentMethod = formData.get("paymentMethod") as PaymentMethod;
  const nextDueDateStr = formData.get("nextPaymentDueDate") as string | null;

  if (!membershipId || !studentId || !amountStr || !paymentMethod) {
    return { error: "Amount and payment method are required." };
  }

  const parsedAmount = parsePaymentAmount(amountStr);
  if (!parsedAmount.ok) {
    return { error: parsedAmount.error };
  }
  if (parsedAmount.value <= 0) {
    return { error: "Please enter a valid amount." };
  }
  const amount = parsedAmount.value;

  if (!PAYMENT_METHODS_FOR_REGULAR.includes(paymentMethod)) {
    return { error: "Invalid payment method. Use bit, paybox, cash, or bank transfer." };
  }

  const membership = await prisma.studentMembership.findFirst({
    where: {
      id: membershipId,
      studentId,
      ...(user.role === "INSTRUCTOR" && user.instructorId
        ? { group: { instructorId: user.instructorId } }
        : {}),
    },
    include: { student: true, group: { include: { center: true } } },
  });

  if (!membership) {
    return { error: "Membership not found or access denied." };
  }

  const paymentDate = new Date();
  paymentDate.setHours(0, 0, 0, 0);

  const studentIdentifierSnapshot = membership.student.identifier;
  const studentNameSnapshot = `${membership.student.firstName} ${membership.student.lastName}`;
  const centerIdSnapshot = membership.group.center?.id ?? null;
  const centerNameSnapshot = membership.group.center?.name ?? null;
  const groupIdSnapshot = membership.group.id;
  const groupNameSnapshot = membership.group.name;

  let year: number;
  let month: number;
  if (membership.paymentDueDate) {
    year = membership.paymentDueDate.getFullYear();
    month = membership.paymentDueDate.getMonth() + 1;
  } else {
    year = paymentDate.getFullYear();
    month = paymentDate.getMonth() + 1;
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        studentId,
        membershipId,
        paymentType: "MONTHLY",
        monthlySubtype: "REGULAR",
        paymentDate,
        amount,
        paymentMethod,
        studentIdentifierSnapshot,
        studentNameSnapshot,
        centerIdSnapshot,
        centerNameSnapshot,
        groupIdSnapshot,
        groupNameSnapshot,
      },
    });

    await tx.paymentMonth.create({
      data: {
        paymentId: payment.id,
        year,
        month,
      },
    });

    if (nextDueDateStr && nextDueDateStr.trim()) {
      const nextDue = new Date(nextDueDateStr);
      nextDue.setHours(0, 0, 0, 0);
      await tx.studentMembership.update({
        where: { id: membershipId },
        data: { paymentDueDate: nextDue },
      });
    }
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  redirect("/dashboard?dataFresh=1");
}
