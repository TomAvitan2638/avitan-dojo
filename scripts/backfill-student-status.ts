/**
 * One-time backfill: update all existing students with correct derived status.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-student-status.ts
 */

import { PrismaClient } from "@prisma/client";
import { computeDerivedStudentStatus } from "../src/lib/student-status";

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: {
      memberships: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { group: { select: { centerId: true } } },
      },
    },
  });

  let updated = 0;
  let noActiveMembership = 0;
  let unchanged = 0;

  for (const student of students) {
    const activeMembership = student.memberships[0] ?? null;

    if (!activeMembership) {
      noActiveMembership++;
    }

    const membershipForStatus = activeMembership
      ? {
          group: activeMembership.group,
          endDate: activeMembership.endDate,
          status: activeMembership.status,
        }
      : null;

    const derivedStatus = computeDerivedStudentStatus(membershipForStatus);

    if (student.status !== derivedStatus) {
      await prisma.student.update({
        where: { id: student.id },
        data: { status: derivedStatus },
      });
      updated++;
      console.log(
        `  Updated ${student.firstName} ${student.lastName} (${student.id}): ${student.status} → ${derivedStatus}`
      );
    } else {
      unchanged++;
    }
  }

  console.log("\n--- Backfill complete ---");
  console.log(`Total students: ${students.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged (already correct): ${unchanged}`);
  console.log(`No active membership: ${noActiveMembership}`);
  console.log(
    `All statuses consistent: ${updated + unchanged === students.length ? "Yes" : "No"}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
