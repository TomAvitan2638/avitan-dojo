import { performance } from "node:perf_hooks";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardPagePayload } from "@/server/data/get-dashboard-page-payload";

const logApi =
  process.env.NODE_ENV === "development" ||
  process.env.DASHBOARD_TIMING_LOG === "1";

/** Authenticated dashboard summary (same aggregation as former RSC load). */
export async function GET() {
  const t0 = performance.now();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getDashboardPagePayload(user);

  if (logApi) {
    console.log(
      `[dashboard-api] GET /api/dashboard total: ${(performance.now() - t0).toFixed(1)}ms`
    );
  }

  return NextResponse.json(payload);
}
