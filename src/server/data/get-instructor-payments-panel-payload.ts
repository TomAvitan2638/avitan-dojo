import type { CurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { InstructorPaymentPanelPayload } from "@/types/instructor-payments-panel";

/**
 * Admin-only: active instructors + recent instructor payments for the payments UI panel.
 */
export async function getInstructorPaymentsPanelPayload(
  user: CurrentUser
): Promise<InstructorPaymentPanelPayload | null> {
  if (user.role !== "ADMIN") {
    return null;
  }

  const [activeInstructors, payments] = await Promise.all([
    prisma.instructor.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.instructorPayment.findMany({
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: {
        instructor: {
          select: { firstName: true, lastName: true },
        },
        months: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
          select: { year: true, month: true },
        },
      },
    }),
  ]);

  const monthNamesHe = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  return {
    activeInstructors: activeInstructors.map((i) => ({
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
    })),
    payments: payments.map((p) => {
      const coveredMonths = p.months.map((m) => ({
        year: m.year,
        month: m.month,
      }));
      const coveredMonthLabels = p.months.map(
        (m) => `${monthNamesHe[m.month - 1]} ${m.year}`
      );
      return {
        id: p.id,
        instructorId: p.instructorId,
        instructorName: `${p.instructor.firstName} ${p.instructor.lastName}`,
        amount: Number(p.amount),
        paymentDateIso: p.paymentDate.toISOString().slice(0, 10),
        coveredMonths,
        coveredMonthLabels,
        coverageSummary:
          coveredMonthLabels.length === 0
            ? "—"
            : coveredMonthLabels.join(" · "),
        notes: p.notes,
        createdAtIso: p.createdAt.toISOString(),
      };
    }),
  };
}
