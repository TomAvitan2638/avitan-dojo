import type { QueryClient } from "@tanstack/react-query";
import type {
  InstructorsPagePayload,
  InstructorsPageQueryScope,
} from "@/types/instructors-page";

export const INSTRUCTORS_PAGE_QUERY_ROOT = [
  "dashboard",
  "instructors-page",
] as const;

export function instructorsPageQueryKey(scope: InstructorsPageQueryScope) {
  return [
    ...INSTRUCTORS_PAGE_QUERY_ROOT,
    { role: scope.role, instructorId: scope.instructorId ?? "none" },
  ] as const;
}

export function invalidateInstructorsPageQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...INSTRUCTORS_PAGE_QUERY_ROOT],
  });
}

export async function fetchInstructorsPagePayload(): Promise<InstructorsPagePayload> {
  const res = await fetch("/api/dashboard/instructors", {
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Failed to load instructors");
  }
  return (await res.json()) as InstructorsPagePayload;
}
