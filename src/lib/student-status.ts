import type { StudentStatus } from "@prisma/client";

/**
 * Membership shape needed to compute derived student status.
 * Used by create/update flows and can be passed from Prisma includes.
 */
type MembershipForStatus = {
  group: { centerId: string } | null;
  endDate: Date | null;
  status: string;
};

/**
 * Derives Student.status from the current active membership state.
 *
 * Rule: Student is ACTIVE only if:
 * - there is a valid active membership
 * - the membership has a group
 * - the group has a center (group.centerId exists)
 * - membership.endDate is null (no end date = still training)
 *
 * Otherwise: inactive
 */
export function computeDerivedStudentStatus(
  membership: MembershipForStatus | null
): StudentStatus {
  if (!membership) return "inactive";
  if (membership.status !== "active") return "inactive";
  if (!membership.group?.centerId) return "inactive";
  if (membership.endDate != null) return "inactive";
  return "active";
}
