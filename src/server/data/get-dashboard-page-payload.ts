import { performance } from "node:perf_hooks";
import type { CurrentUser } from "@/lib/auth";
import {
  logDashboardPayloadTotal,
  timeDashboardSection,
} from "@/lib/dashboard-payload-timing";
import { getDashboardStats } from "@/server/services/dashboard-service";
import {
  getUpcomingBirthdays,
  getLatePayments,
} from "@/server/services/reminder-service";
import { getLateInstructorPayments } from "@/server/services/instructor-payment-service";
import type { DashboardPagePayload } from "@/types/dashboard-page";

export { getDashboardPageScope } from "@/lib/dashboard-page-scope";

/**
 * Aggregated main dashboard data. Used by GET /api/dashboard.
 *
 * All three loads run in parallel (independent queries). Wall time ≈ slowest leg,
 * not the sum of sequential stats + reminders.
 */
export async function getDashboardPagePayload(
  user: CurrentUser
): Promise<DashboardPagePayload> {
  const t0All = performance.now();

  const [stats, birthdays, latePayments, lateInstructorPayments] =
    await Promise.all([
      timeDashboardSection("getDashboardStats", () => getDashboardStats(user)),
      timeDashboardSection("getUpcomingBirthdays", () =>
        getUpcomingBirthdays(user)
      ),
      timeDashboardSection("getLatePayments", () => getLatePayments(user)),
      timeDashboardSection("getLateInstructorPayments", () =>
        getLateInstructorPayments(user)
      ),
    ]);

  logDashboardPayloadTotal(
    "Promise.all(stats,birthdays,latePayments,lateInstructorPayments)",
    t0All
  );

  return { stats, birthdays, latePayments, lateInstructorPayments };
}
