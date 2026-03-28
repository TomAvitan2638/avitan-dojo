import type { QueryClient } from "@tanstack/react-query";
import { notifyDataWrite } from "@/lib/data-write-bus";
import type {
  StudentsPagePayload,
  StudentsPageQueryScope,
} from "@/types/students-page";

export const STUDENTS_PAGE_QUERY_ROOT = ["dashboard", "students-page"] as const;

export function studentsPageQueryKey(scope: StudentsPageQueryScope) {
  return [
    ...STUDENTS_PAGE_QUERY_ROOT,
    { role: scope.role, instructorId: scope.instructorId ?? "none" },
  ] as const;
}

export function invalidateStudentsPageQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: [...STUDENTS_PAGE_QUERY_ROOT],
  });
}

/** After student mutations that affect dashboard KPIs / birthdays / late payments. */
export async function invalidateStudentsPageAndDashboardHome(
  queryClient: QueryClient
) {
  await invalidateStudentsPageQueries(queryClient);
  notifyDataWrite();
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalize JSON API rows so date fields match RSC-passed Date objects. */
export function normalizeStudentsPagePayload(
  raw: StudentsPagePayload
): StudentsPagePayload {
  return {
    ...raw,
    students: raw.students.map((row) => ({
      ...row,
      registrationDateRaw: toDateOrNull(row.registrationDateRaw),
      endDateRaw: toDateOrNull(row.endDateRaw),
    })),
  };
}

export async function fetchStudentsPagePayload(): Promise<StudentsPagePayload> {
  const res = await fetch("/api/dashboard/students", {
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Failed to load students");
  }
  const data = (await res.json()) as StudentsPagePayload;
  return normalizeStudentsPagePayload(data);
}
