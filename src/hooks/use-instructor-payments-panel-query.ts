"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchInstructorPaymentsPanel,
  instructorPaymentsPanelQueryKey,
} from "@/lib/instructor-payments-query";
import type { InstructorPaymentPanelPayload } from "@/types/instructor-payments-panel";

const STALE_MS = 120_000;
const GC_MS = 600_000;

export function useInstructorPaymentsPanelQuery(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<InstructorPaymentPanelPayload>({
    queryKey: instructorPaymentsPanelQueryKey(),
    queryFn: fetchInstructorPaymentsPanel,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    enabled,
  });
}
