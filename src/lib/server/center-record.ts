import "server-only";

import { prisma } from "@/lib/db";

/** Prisma fetch for center detail — same shape as `/dashboard/centers/[id]/page.tsx`. */
export async function fetchCenterRecordForDetail(id: string) {
  return prisma.center.findUnique({
    where: { id },
    include: {
      instructor: true,
      groups: true,
    },
  });
}

/** Instructor options for center edit — same query as `centers/[id]/edit/page.tsx`. */
export async function fetchInstructorsForCenterSelect() {
  const instructors = await prisma.instructor.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });
  return instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));
}
