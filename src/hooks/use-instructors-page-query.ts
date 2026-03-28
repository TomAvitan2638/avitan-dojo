"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  InstructorsPagePayload,
  InstructorsPageQueryScope,
} from "@/types/instructors-page";
import {
  fetchInstructorsPagePayload,
  instructorsPageQueryKey,
} from "@/lib/instructors-page-query";

const STALE_MS = 240_000;
const GC_MS = 600_000;

type Options = {
  scope: InstructorsPageQueryScope;
};

/** Single owner of Instructors tab list payload; first load hits GET /api/dashboard/instructors. */
export function useInstructorsPageQuery({ scope }: Options) {
  return useQuery<InstructorsPagePayload>({
    queryKey: instructorsPageQueryKey(scope),
    queryFn: fetchInstructorsPagePayload,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
