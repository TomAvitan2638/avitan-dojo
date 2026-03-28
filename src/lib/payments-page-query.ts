import type { QueryClient } from "@tanstack/react-query";
import type {
  PaymentsPagePayload,
  PaymentsPageListParams,
  PaymentsPageQueryScope,
} from "@/types/payments-page";
import { notifyDataWrite } from "@/lib/data-write-bus";

export const PAYMENTS_PAGE_QUERY_ROOT = ["dashboard", "payments-page"] as const;

export function paymentsPageQueryKey(
  scope: PaymentsPageQueryScope,
  list: PaymentsPageListParams
) {
  return [
    ...PAYMENTS_PAGE_QUERY_ROOT,
    { role: scope.role, instructorId: scope.instructorId ?? "none" },
    {
      page: list.page,
      search: list.search,
      filterType: list.filterType || "",
      filterSubtype: list.filterSubtype || "",
    },
  ] as const;
}

export function invalidatePaymentsPageQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...PAYMENTS_PAGE_QUERY_ROOT],
  });
}

/** Page list + {@link notifyDataWrite} (dashboard generation + invalidate). */
export async function invalidatePaymentsPageAndDashboardHome(
  queryClient: QueryClient
) {
  await invalidatePaymentsPageQueries(queryClient);
  notifyDataWrite();
}

function buildPaymentsApiSearchParams(list: PaymentsPageListParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(list.page));
  if (list.search) qs.set("search", list.search);
  if (list.filterType) qs.set("filterType", list.filterType);
  if (list.filterSubtype) qs.set("filterSubtype", list.filterSubtype);
  return qs.toString();
}

export async function fetchPaymentsPagePayload(
  list: PaymentsPageListParams
): Promise<PaymentsPagePayload> {
  const q = buildPaymentsApiSearchParams(list);
  const res = await fetch(`/api/dashboard/payments?${q}`, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Failed to load payments");
  }
  return (await res.json()) as PaymentsPagePayload;
}
