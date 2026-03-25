import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BeltsPageClient } from "./belts-page-client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const BELTS_PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BeltsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * BELTS_PAGE_SIZE;

  const whereClause =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : {};

  const [students, totalCount] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
    select: {
      id: true,
      identifier: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          group: {
            select: {
              name: true,
              center: { select: { name: true } },
            },
          },
        },
      },
      beltHistory: {
        orderBy: { promotionDate: "desc" },
        select: {
          id: true,
          promotionDate: true,
          createdAt: true,
          beltLevel: { select: { name: true, orderNumber: true } },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    skip,
    take: BELTS_PAGE_SIZE,
  }),
    prisma.student.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / BELTS_PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const studentsForTable = students.map((s) => {
    const activeMembership = s.memberships[0] ?? null;
    const latestBelt = s.beltHistory[0] ?? null;
    return {
      id: s.id,
      identifier: s.identifier,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName} ${s.lastName}`,
      photoUrl: s.photoUrl,
      centerName: activeMembership?.group.center.name ?? null,
      groupName: activeMembership?.group.name ?? null,
      currentBeltName: latestBelt?.beltLevel.name ?? null,
      currentBeltOrder: latestBelt?.beltLevel.orderNumber ?? null,
      currentBeltDate: latestBelt
        ? format(latestBelt.promotionDate, "dd/MM/yyyy")
        : null,
      currentBeltDateRaw: latestBelt?.promotionDate ?? null,
      beltHistory: s.beltHistory.map((h) => ({
        id: h.id,
        beltName: h.beltLevel.name,
        beltOrder: h.beltLevel.orderNumber,
        promotionDate: format(h.promotionDate, "dd/MM/yyyy"),
        promotionDateRaw: h.promotionDate,
        createdAt: format(h.createdAt, "dd/MM/yyyy HH:mm"),
        createdAtRaw: h.createdAt,
      })),
    };
  });

  return (
    <div className="min-h-screen">
      <Header title="דרגות" />
      <div className="p-6">
        <BeltsPageClient
          students={studentsForTable}
          totalCount={totalCount}
          currentPage={safePage}
          pageSize={BELTS_PAGE_SIZE}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
