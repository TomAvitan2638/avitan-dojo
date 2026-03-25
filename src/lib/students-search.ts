import type { Prisma } from "@prisma/client";
import type { StudentStatus } from "@prisma/client";
import { statusesMatchingToken } from "@/lib/student-search-tokens";

export { statusesMatchingToken } from "@/lib/student-search-tokens";

/** Active membership: matches displayed center/group on the Students table. */
function activeMembershipGroupWhere(
  groupPredicate: Prisma.GroupWhereInput
): Prisma.StudentWhereInput {
  return {
    memberships: {
      some: {
        status: "active",
        group: groupPredicate,
      },
    },
  };
}

/**
 * OR conditions for a single search phrase (partial contains on scalar + relations).
 */
function broadOrForPhrase(phrase: string): Prisma.StudentWhereInput[] {
  const pl = phrase.toLowerCase();
  const ors: Prisma.StudentWhereInput[] = [
    { identifier: { contains: pl, mode: "insensitive" } },
    { firstName: { contains: pl, mode: "insensitive" } },
    { lastName: { contains: pl, mode: "insensitive" } },
    activeMembershipGroupWhere({
      name: { contains: pl, mode: "insensitive" },
    }),
    activeMembershipGroupWhere({
      center: { name: { contains: pl, mode: "insensitive" } },
    }),
  ];

  const st = statusesMatchingToken(phrase);
  if (st.length) {
    ors.push({ status: { in: st } });
  }

  if (/^\d+$/.test(phrase.trim())) {
    const n = parseInt(phrase, 10);
    if (!Number.isNaN(n)) {
      ors.push({ studentNumber: n });
    }
  }

  return ors;
}

function twoTokenFullName(t1: string, t2: string): Prisma.StudentWhereInput {
  return {
    OR: [
      {
        AND: [
          { firstName: { contains: t1, mode: "insensitive" } },
          { lastName: { contains: t2, mode: "insensitive" } },
        ],
      },
      {
        AND: [
          { firstName: { contains: t2, mode: "insensitive" } },
          { lastName: { contains: t1, mode: "insensitive" } },
        ],
      },
    ],
  };
}

/** 3+ tokens: first + rest-of-name, and reversed (last token as first name, preceding as last). */
function multiTokenFullName(tokens: string[]): Prisma.StudentWhereInput {
  const first = tokens[0];
  const rest = tokens.slice(1).join(" ");
  const last = tokens[tokens.length - 1];
  const restFirst = tokens.slice(0, -1).join(" ");
  return {
    OR: [
      {
        AND: [
          { firstName: { contains: first, mode: "insensitive" } },
          { lastName: { contains: rest, mode: "insensitive" } },
        ],
      },
      {
        AND: [
          { firstName: { contains: last, mode: "insensitive" } },
          { lastName: { contains: restFirst, mode: "insensitive" } },
        ],
      },
    ],
  };
}

/**
 * Server-side student list filter: partial match across fields + full-name token logic.
 * Returns null when search is empty (caller uses only base scope).
 */
export function buildStudentSearchWhere(search: string): Prisma.StudentWhereInput | null {
  const normalized = search.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const tokens = normalized.split(" ").filter(Boolean);
  const orParts: Prisma.StudentWhereInput[] = [];

  orParts.push({ OR: broadOrForPhrase(normalized) });

  if (tokens.length >= 2) {
    orParts.push(twoTokenFullName(tokens[0], tokens[1]));
    orParts.push({
      AND: tokens.map((t) => ({ OR: broadOrForPhrase(t) })),
    });
  }

  if (tokens.length >= 3) {
    orParts.push(multiTokenFullName(tokens));
  }

  return { OR: orParts };
}

type UserScope = { role: string; instructorId: string | null };

export function buildStudentsWhere(user: UserScope, search: string): Prisma.StudentWhereInput {
  const baseWhere: Prisma.StudentWhereInput =
    user.role === "INSTRUCTOR" && user.instructorId
      ? {
          memberships: {
            some: { group: { instructorId: user.instructorId } },
          },
        }
      : {};

  const searchWhere = buildStudentSearchWhere(search);
  if (!searchWhere) return baseWhere;

  const hasBase = Object.keys(baseWhere).length > 0;
  return hasBase ? { AND: [baseWhere, searchWhere] } : searchWhere;
}
