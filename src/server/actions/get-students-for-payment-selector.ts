"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type StudentOption = {
  id: string;
  identifier: string;
  /** Combined display name (first + last) */
  name: string;
  firstName: string;
  lastName: string;
  hasActiveMembership: boolean;
  centerName: string | null;
  groupName: string | null;
};

/**
 * Fetches minimal student data for the payment create/edit selector.
 * Called on demand when the create payment dialog opens to avoid loading
 * all students on initial page load.
 */
export async function getStudentsForPaymentSelector(): Promise<StudentOption[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const where =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : {};

  const students = await prisma.student.findMany({
    where,
    select: {
      id: true,
      identifier: true,
      firstName: true,
      lastName: true,
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
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return students.map((s) => {
    const activeMembership = s.memberships[0] ?? null;
    return {
      id: s.id,
      identifier: s.identifier,
      name: `${s.firstName} ${s.lastName}`,
      firstName: s.firstName,
      lastName: s.lastName,
      hasActiveMembership: !!activeMembership,
      centerName: activeMembership?.group.center.name ?? null,
      groupName: activeMembership?.group.name ?? null,
    };
  });
}
