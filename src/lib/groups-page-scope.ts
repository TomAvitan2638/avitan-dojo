import type { CurrentUser } from "@/lib/auth";
import type { GroupsPageQueryScope } from "@/types/groups-page";

/** Pure scope for React Query keys — aligns with Students / Instructors tabs. */
export function getGroupsPageScope(user: CurrentUser): GroupsPageQueryScope {
  return {
    role: user.role,
    instructorId: user.instructorId,
  };
}
