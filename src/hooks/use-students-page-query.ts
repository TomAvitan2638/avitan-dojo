"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  StudentsPagePayload,
  StudentsPageQueryScope,
} from "@/types/students-page";
import {
  fetchStudentsPagePayload,
  studentsPageQueryKey,
} from "@/lib/students-page-query";

const STALE_MS = 240_000;
const GC_MS = 600_000;

type Options = {
  scope: StudentsPageQueryScope;
};

/** Single owner of Students tab list payload; first load hits GET /api/dashboard/students. */
export function useStudentsPageQuery({ scope }: Options) {
  return useQuery<StudentsPagePayload>({
    queryKey: studentsPageQueryKey(scope),
    queryFn: fetchStudentsPagePayload,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}
