import { performance } from "node:perf_hooks";

/**
 * When `NODE_ENV === "development"` or `DASHBOARD_TIMING_LOG=1`, logs wall time per section.
 * In `getDashboardPagePayload`, sections run in parallel — each line is that task's duration,
 * not additive. Compare `GET /api/dashboard` total (logged in route) to max(section).
 */
const logTimings =
  process.env.NODE_ENV === "development" ||
  process.env.DASHBOARD_TIMING_LOG === "1";

export async function timeDashboardSection<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    if (logTimings) {
      const ms = performance.now() - start;
      console.log(`[dashboard-payload] ${label}: ${ms.toFixed(1)}ms`);
    }
  }
}

export function logDashboardPayloadTotal(label: string, startMs: number): void {
  if (logTimings) {
    console.log(
      `[dashboard-payload] ${label} (total): ${(performance.now() - startMs).toFixed(1)}ms`
    );
  }
}
