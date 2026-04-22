import type { QueryClient } from "@tanstack/react-query";
import type { InstructorPaymentPanelPayload } from "@/types/instructor-payments-panel";
import { notifyDataWrite } from "@/lib/data-write-bus";

export const INSTRUCTOR_PAYMENTS_PANEL_QUERY_ROOT = [
  "dashboard",
  "instructor-payments-panel",
] as const;

export function instructorPaymentsPanelQueryKey() {
  return [...INSTRUCTOR_PAYMENTS_PANEL_QUERY_ROOT] as const;
}

export async function fetchInstructorPaymentsPanel(): Promise<InstructorPaymentPanelPayload> {
  const res = await fetch("/api/dashboard/instructor-payments", {
    credentials: "same-origin",
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("אין הרשאה");
    }
    throw new Error("שגיאה בטעינת תשלומי מאמנים");
  }
  return res.json() as Promise<InstructorPaymentPanelPayload>;
}

export function invalidateInstructorPaymentsPanelQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...INSTRUCTOR_PAYMENTS_PANEL_QUERY_ROOT],
  });
}

/** After recording an instructor payment: refresh panel + bump dashboard summary. */
export async function invalidateInstructorPaymentsPanelAndDashboardHome(
  queryClient: QueryClient
) {
  await invalidateInstructorPaymentsPanelQueries(queryClient);
  notifyDataWrite();
}
