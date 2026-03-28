import "server-only";

import { prisma } from "@/lib/db";

/** Prisma fetch for instructor detail — same shape as `/dashboard/instructors/[id]/page.tsx`. */
export async function fetchInstructorRecordForDetail(id: string) {
  return prisma.instructor.findUnique({
    where: { id },
    include: {
      groups: { include: { center: true } },
      centers: true,
    },
  });
}

/** Prisma fetch for instructor edit — same shape as `instructors/[id]/edit/page.tsx`. */
export async function fetchInstructorRecordForEdit(id: string) {
  return prisma.instructor.findUnique({
    where: { id },
  });
}
