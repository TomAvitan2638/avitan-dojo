import type { QueryClient } from "@tanstack/react-query";
import { notifyDataWrite } from "@/lib/data-write-bus";
import type {
  GroupsPagePayload,
  GroupsPageQueryScope,
} from "@/types/groups-page";

export const GROUPS_PAGE_QUERY_ROOT = ["dashboard", "groups-page"] as const;

export function groupsPageQueryKey(scope: GroupsPageQueryScope) {
  return [
    ...GROUPS_PAGE_QUERY_ROOT,
    { role: scope.role, instructorId: scope.instructorId ?? "none" },
  ] as const;
}

export function invalidateGroupsPageQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...GROUPS_PAGE_QUERY_ROOT],
  });
}

/** After group mutations that affect dashboard active-group stats and scoping. */
export async function invalidateGroupsPageAndDashboardHome(
  queryClient: QueryClient
) {
  await invalidateGroupsPageQueries(queryClient);
  notifyDataWrite();
}

export async function fetchGroupsPagePayload(): Promise<GroupsPagePayload> {
  const res = await fetch("/api/dashboard/groups", {
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Failed to load groups");
  }
  return (await res.json()) as GroupsPagePayload;
}
