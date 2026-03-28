import type { QueryClient } from "@tanstack/react-query";
import type {
  DashboardPagePayload,
  DashboardPageQueryScope,
} from "@/types/dashboard-page";

/** Root key for the main dashboard summary; use for targeted invalidation later. */
export const DASHBOARD_HOME_QUERY_ROOT = ["dashboard", "home-page"] as const;

/**
 * `dataWriteGeneration` bumps on any {@link notifyDataWrite} so cache keys rotate after mutations
 * (reliable refetch on next dashboard visit even if invalidation timing misses).
 */
export function dashboardHomePageQueryKey(
  scope: DashboardPageQueryScope,
  dataWriteGeneration: number
) {
  return [
    ...DASHBOARD_HOME_QUERY_ROOT,
    { role: scope.role, instructorId: scope.instructorId ?? "none" },
    { dataWriteGeneration },
  ] as const;
}

/**
 * Invalidate cached main-dashboard summary (e.g. after payments, membership, or student changes).
 * Call from specific flows when you want the home dashboard to refetch; avoid blanket invalidation.
 */
export function invalidateDashboardHomeQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...DASHBOARD_HOME_QUERY_ROOT],
  });
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalize JSON (ISO date strings) for client widget types. */
export function normalizeDashboardPagePayload(
  raw: DashboardPagePayload
): DashboardPagePayload {
  return {
    ...raw,
    birthdays: raw.birthdays.map((b) => ({
      ...b,
      birthDate: toDateOrNull(b.birthDate as unknown as string | Date | null),
    })),
  };
}

export async function fetchDashboardPagePayload(): Promise<DashboardPagePayload> {
  const res = await fetch("/api/dashboard", {
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Failed to load dashboard");
  }
  const data = (await res.json()) as DashboardPagePayload;
  return normalizeDashboardPagePayload(data);
}
