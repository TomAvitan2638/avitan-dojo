import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentsPageClient } from "./payments-page-client";
import {
  formatDateOnlyToDisplay,
  formatDateOnlyToIso,
} from "@/lib/date-only";

export const dynamic = "force-dynamic";

const PAYMENTS_PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    filterType?: string;
    filterSubtype?: string;
  }>;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  MONTHLY: "חודשי",
  EQUIPMENT: "ציוד",
  EXAM: "מבחן",
};
const MONTHLY_SUBTYPE_LABELS: Record<string, string> = {
  REGULAR: "תשלום רגיל",
  CHECK: "המחאה",
  WAIVER: "פטור מתשלום",
};

function labelToPaymentType(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [k, v] of Object.entries(PAYMENT_TYPE_LABELS)) {
    if (v.toLowerCase().includes(lower) || k.toLowerCase().includes(lower))
      return k;
  }
  return null;
}
function labelToMonthlySubtype(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [k, v] of Object.entries(MONTHLY_SUBTYPE_LABELS)) {
    if (v.toLowerCase().includes(lower) || k.toLowerCase().includes(lower))
      return k;
  }
  return null;
}

export default async function PaymentsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = (params.search ?? "").trim();
  const filterType = params.filterType as
    | "MONTHLY"
    | "EQUIPMENT"
    | "EXAM"
    | undefined;
  const filterSubtype = params.filterSubtype as
    | "REGULAR"
    | "CHECK"
    | "WAIVER"
    | undefined;

  const skip = (page - 1) * PAYMENTS_PAGE_SIZE;

  const baseWhere = {
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
  };

  const andConditions: Record<string, unknown>[] = [baseWhere];

  if (filterType) {
    andConditions.push({ paymentType: filterType });
  }
  if (filterType === "MONTHLY" && filterSubtype) {
    andConditions.push({ monthlySubtype: filterSubtype });
  }

  const q = search.toLowerCase();
  if (q) {
    const searchOr: Record<string, unknown>[] = [
      {
        studentIdentifierSnapshot: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        studentNameSnapshot: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        centerNameSnapshot: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
      {
        groupNameSnapshot: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
    ];
    const typeMatch = labelToPaymentType(search);
    if (typeMatch) {
      searchOr.push({ paymentType: typeMatch });
    }
    const subtypeMatch = labelToMonthlySubtype(search);
    if (subtypeMatch) {
      searchOr.push({ monthlySubtype: subtypeMatch });
    }
    andConditions.push({ OR: searchOr });
  }

  const whereClause =
    andConditions.length === 1 ? baseWhere : { AND: andConditions };

  // Critical batch first (max 2 connections), then secondary (max 2 connections)
  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where: whereClause,
      select: {
        id: true,
        studentId: true,
        paymentType: true,
        monthlySubtype: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        studentIdentifierSnapshot: true,
        studentNameSnapshot: true,
        centerNameSnapshot: true,
        groupNameSnapshot: true,
        equipmentNotes: true,
        examCode: true,
        examDate: true,
        bankNumber: true,
        checkNumber: true,
        waiverReason: true,
        paymentMonths: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
          select: { year: true, month: true },
        },
        paymentEquipmentItems: {
          select: { equipmentCode: true, quantity: true, unitAmountSnapshot: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: PAYMENTS_PAGE_SIZE,
    }),
    prisma.payment.count({ where: whereClause }),
  ]);

  const [sportsEquipment, exams] = await Promise.all([
    prisma.sportsEquipment.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, description: true, amount: true },
    }),
    prisma.exam.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, description: true, amount: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAYMENTS_PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const paymentsForList = payments.map((p) => ({
    id: p.id,
    studentId: p.studentId,
    paymentType: p.paymentType!,
    monthlySubtype: p.monthlySubtype,
    paymentDate: formatDateOnlyToDisplay(p.paymentDate),
    paymentDateRaw: p.paymentDate,
    paymentDateIso: formatDateOnlyToIso(p.paymentDate),
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    studentIdentifier: p.studentIdentifierSnapshot ?? "",
    studentName: p.studentNameSnapshot ?? "",
    centerName: p.centerNameSnapshot,
    groupName: p.groupNameSnapshot,
    months: p.paymentMonths.map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`),
    equipmentItems: p.paymentEquipmentItems.map((i) => ({
      code: i.equipmentCode,
      quantity: i.quantity,
      unitAmountSnapshot: i.unitAmountSnapshot != null ? Number(i.unitAmountSnapshot) : null,
    })),
    equipmentNotes: p.equipmentNotes,
    examCode: p.examCode,
    examDate: p.examDate ? formatDateOnlyToDisplay(p.examDate) : null,
    examDateIso: p.examDate ? formatDateOnlyToIso(p.examDate) : null,
    bankNumber: p.bankNumber,
    checkNumber: p.checkNumber,
    waiverReason: p.waiverReason,
  }));

  return (
    <div className="min-h-screen">
      <Header title="תשלומים" />
      <div className="p-6">
        <Suspense fallback={<div className="text-muted-foreground">טוען...</div>}>
          <PaymentsPageClient
            payments={paymentsForList}
            totalCount={totalCount}
            currentPage={safePage}
            pageSize={PAYMENTS_PAGE_SIZE}
            totalPages={totalPages}
            initialSearch={search}
            initialFilterPaymentType={filterType ?? ""}
            initialFilterMonthlySubtype={filterSubtype ?? ""}
            sportsEquipment={sportsEquipment.map((e) => ({
              ...e,
              amount: Number(e.amount),
            }))}
            exams={exams.map((e) => ({
              ...e,
              amount: Number(e.amount),
            }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
