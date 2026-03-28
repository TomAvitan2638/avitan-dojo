"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DashboardPagePayload,
  DashboardPageQueryScope,
} from "@/types/dashboard-page";
import {
  dashboardHomePageQueryKey,
  fetchDashboardPagePayload,
} from "@/lib/dashboard-page-query";
import { useDataWriteGeneration } from "@/components/providers/data-write-sync-provider";

const STALE_MS = 240_000;
const GC_MS = 600_000;

type Options = {
  scope: DashboardPageQueryScope;
};

/**
 * Main dashboard summary (stats + birthdays + late payments).
 * Query key includes data-write generation so any {@link notifyDataWrite} forces a fresh slice.
 */
export function useDashboardPageQuery({ scope }: Options) {
  const dataWriteGeneration = useDataWriteGeneration();
  return useQuery<DashboardPagePayload>({
    queryKey: dashboardHomePageQueryKey(scope, dataWriteGeneration),
    queryFn: fetchDashboardPagePayload,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
