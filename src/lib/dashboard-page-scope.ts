import type { CurrentUser } from "@/lib/auth";
import type { DashboardPageQueryScope } from "@/types/dashboard-page";

/** Scope for React Query keys — dashboard stats/widgets are instructor-scoped when applicable. */
export function getDashboardPageScope(user: CurrentUser): DashboardPageQueryScope {
  return {
    role: user.role,
    instructorId: user.instructorId,
  };
}
