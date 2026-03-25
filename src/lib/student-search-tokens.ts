import type { StudentStatus } from "@prisma/client";

/**
 * Maps a search token to possible `StudentStatus` enum values.
 * Shared by server-side Prisma search and client-side list filtering.
 */
export function statusesMatchingToken(token: string): StudentStatus[] {
  const t = token.toLowerCase().trim();
  const enums: StudentStatus[] = ["active", "expired", "inactive", "retired"];
  const out = new Set<StudentStatus>();
  for (const s of enums) {
    if (s === t) out.add(s);
    else if (t.length >= 2 && s.startsWith(t)) out.add(s);
  }
  if (token === "פעיל") out.add("active");
  if (token === "פג תוקף") out.add("expired");
  if (token === "לא פעיל") {
    out.add("inactive");
    out.add("expired");
    out.add("retired");
  }
  if (token === "פרש" || token === "פנסיה") out.add("retired");
  return [...out];
}
