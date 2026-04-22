import type { DashboardStats } from "@/server/services/dashboard-service";
import type {
  UpcomingBirthdayStudent,
  LatePaymentItem,
} from "@/server/services/reminder-service";
import type { LateInstructorPaymentItem } from "@/server/services/instructor-payment-service";

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
  /** Admin: missing instructor monthly fees in the rolling late window; empty for instructors. */
  lateInstructorPayments: LateInstructorPaymentItem[];
};
