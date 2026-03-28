"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  PaymentsPagePayload,
  PaymentsPageListParams,
  PaymentsPageQueryScope,
} from "@/types/payments-page";
import {
  fetchPaymentsPagePayload,
  paymentsPageQueryKey,
} from "@/lib/payments-page-query";

const STALE_MS = 240_000;
const GC_MS = 600_000;

type Options = {
  scope: PaymentsPageQueryScope;
  listParams: PaymentsPageListParams;
};

export function usePaymentsPageQuery({ scope, listParams }: Options) {
  return useQuery<PaymentsPagePayload>({
    queryKey: paymentsPageQueryKey(scope, listParams),
    queryFn: () => fetchPaymentsPagePayload(listParams),
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
