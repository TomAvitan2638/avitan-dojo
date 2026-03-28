"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  GroupsPagePayload,
  GroupsPageQueryScope,
} from "@/types/groups-page";
import {
  fetchGroupsPagePayload,
  groupsPageQueryKey,
} from "@/lib/groups-page-query";

const STALE_MS = 240_000;
const GC_MS = 600_000;

type Options = {
  scope: GroupsPageQueryScope;
};

/** Single owner of Groups tab payload; first load hits GET /api/dashboard/groups. */
export function useGroupsPageQuery({ scope }: Options) {
  return useQuery<GroupsPagePayload>({
    queryKey: groupsPageQueryKey(scope),
    queryFn: fetchGroupsPagePayload,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
