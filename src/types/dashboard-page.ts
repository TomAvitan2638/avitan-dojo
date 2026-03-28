import type { DashboardStats } from "@/server/services/dashboard-service";
import type {
  UpcomingBirthdayStudent,
  LatePaymentItem,
} from "@/server/services/reminder-service";

export type DashboardPageQueryScope = {
  role: string;
  instructorId: string | null;
};

/**
 * Main dashboard summary payload (stats + reminder widgets).
 * Mirrors what the former RSC page loaded in one place.
 */
export type DashboardPagePayload = {
  stats: DashboardStats;
  birthdays: UpcomingBirthdayStudent[];
  latePayments: LatePaymentItem[];
};
