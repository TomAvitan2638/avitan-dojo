import type { CurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { InstructorsPagePayload } from "@/types/instructors-page";

export { getInstructorsPageScope } from "@/lib/instructors-page-scope";

/**
 * Instructors tab list payload. Used by GET /api/dashboard/instructors (and kept
 * centralized here so Prisma shape matches a single definition).
 */
export async function getInstructorsPagePayload(
  _user: CurrentUser
): Promise<InstructorsPagePayload> {
  const instructors = await prisma.instructor.findMany({
    include: {
      _count: { select: { groups: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const instructorsForList = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
    phone: i.phone ?? "-",
    email: i.email ?? "-",
    city: i.city ?? "-",
    photoUrl: i.photoUrl,
    isActive: i.isActive,
    groupsCount: i._count.groups,
  }));

  return { instructors: instructorsForList };
}
