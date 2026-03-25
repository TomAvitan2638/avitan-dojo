import type { StudentStatus } from "@prisma/client";
import { statusesMatchingToken } from "@/lib/student-search-tokens";

/** Lean row from the Students tab list query (client-side filter + table). */
export type StudentListRow = {
  id: string;
  identifier: string;
  studentNumber: number | null;
  firstName: string;
  lastName: string;
  name: string;
  status: string;
  photoUrl: string | null;
  centerName: string | null;
  groupName: string | null;
  registrationDate: string | null;
  endDate: string | null;
  registrationDateRaw: string | Date | null;
  endDateRaw: string | Date | null;
};

function includesInsensitive(hay: string | null | undefined, needle: string): boolean {
  if (hay == null) return false;
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function broadRowMatchesPhrase(row: StudentListRow, phrase: string): boolean {
  const pl = phrase.toLowerCase().trim();
  if (!pl) return true;

  if (includesInsensitive(row.identifier, pl)) return true;
  if (includesInsensitive(row.firstName, pl)) return true;
  if (includesInsensitive(row.lastName, pl)) return true;
  if (includesInsensitive(row.name, pl)) return true;
  if (includesInsensitive(row.centerName, pl)) return true;
  if (includesInsensitive(row.groupName, pl)) return true;
  if (includesInsensitive(row.registrationDate, pl)) return true;
  if (includesInsensitive(row.endDate, pl)) return true;

  const st = statusesMatchingToken(phrase);
  if (st.length && st.includes(row.status as StudentStatus)) return true;

  /** UI labels for status badge — allow search by Hebrew */
  if (pl === "פעיל" && row.status === "active") return true;
  if (
    (pl === "לא פעיל" || pl.includes("לא פעיל")) &&
    row.status !== "active"
  ) {
    return true;
  }

  if (/^\d+$/.test(phrase.trim())) {
    const n = parseInt(phrase, 10);
    if (!Number.isNaN(n) && row.studentNumber === n) return true;
  }

  return false;
}

function twoTokenFullNameMatches(
  row: StudentListRow,
  t1: string,
  t2: string
): boolean {
  const f1 = includesInsensitive(row.firstName, t1) && includesInsensitive(row.lastName, t2);
  const f2 = includesInsensitive(row.firstName, t2) && includesInsensitive(row.lastName, t1);
  return f1 || f2;
}

function multiTokenFullNameMatches(row: StudentListRow, tokens: string[]): boolean {
  const first = tokens[0];
  const rest = tokens.slice(1).join(" ");
  const last = tokens[tokens.length - 1];
  const restFirst = tokens.slice(0, -1).join(" ");
  const a =
    includesInsensitive(row.firstName, first) && includesInsensitive(row.lastName, rest);
  const b =
    includesInsensitive(row.firstName, last) && includesInsensitive(row.lastName, restFirst);
  return a || b;
}

/**
 * Client-side filter mirroring `buildStudentSearchWhere` behavior for list rows.
 */
export function filterStudentListRows<T extends StudentListRow>(
  rows: T[],
  search: string
): T[] {
  const normalized = search.trim().replace(/\s+/g, " ");
  if (!normalized) return rows;

  const tokens = normalized.split(" ").filter(Boolean);

  return rows.filter((row) => {
    const orParts: boolean[] = [broadRowMatchesPhrase(row, normalized)];

    if (tokens.length >= 2) {
      orParts.push(twoTokenFullNameMatches(row, tokens[0], tokens[1]));
      orParts.push(tokens.every((t) => broadRowMatchesPhrase(row, t)));
    }

    if (tokens.length >= 3) {
      orParts.push(multiTokenFullNameMatches(row, tokens));
    }

    return orParts.some(Boolean);
  });
}
