/**
 * Belt-level migration: updates belt list/order while PRESERVING StudentBeltHistory.
 *
 * This script:
 * - Creates new belt levels if missing
 * - Updates orderNumber on existing belts
 * - Remaps StudentBeltHistory from old belt names to new (e.g. White -> קיו 1)
 * - Deletes only orphan belt levels (no history references)
 *
 * NEVER delete StudentBeltHistory as part of belt migration.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-belt-levels.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_BELT_LEVELS = [
  { name: "קיו 1", orderNumber: 1 },
  { name: "קיו 1 + פס", orderNumber: 2 },
  { name: "קיו 1 + 2 פסים", orderNumber: 3 },
  { name: "קיו 2", orderNumber: 4 },
  { name: "קיו 2 + פס", orderNumber: 5 },
  { name: "קיו 2 + 2 פסים", orderNumber: 6 },
  { name: "קיו 3", orderNumber: 7 },
  { name: "קיו 3 + פס", orderNumber: 8 },
  { name: "קיו 3 + 2 פסים", orderNumber: 9 },
  { name: "קיו 4", orderNumber: 10 },
  { name: "קיו 4 + פס", orderNumber: 11 },
  { name: "קיו 4 + 2 פסים", orderNumber: 12 },
  { name: "קיו 5", orderNumber: 13 },
  { name: "קיו 5 + פס", orderNumber: 14 },
  { name: "קיו 5 + 2 פסים", orderNumber: 15 },
  { name: "קיו 6", orderNumber: 16 },
  { name: "קיו 6 + פס", orderNumber: 17 },
  { name: "קיו 6 + 2 פסים", orderNumber: 18 },
  { name: "קיו 7", orderNumber: 19 },
  { name: "קיו 7 + פס", orderNumber: 20 },
  { name: "קיו 7 + 2 פסים", orderNumber: 21 },
  { name: "קיו 8", orderNumber: 22 },
  { name: "קיו 8 + פס", orderNumber: 23 },
  { name: "קיו 8 + 2 פסים", orderNumber: 24 },
  { name: "קיו 9", orderNumber: 25 },
  { name: "קיו 9 + פס", orderNumber: 26 },
  { name: "קיו 9 + 2 פסים", orderNumber: 27 },
  { name: "דאן 1", orderNumber: 28 },
  { name: "דאן 2", orderNumber: 29 },
  { name: "דאן 3", orderNumber: 30 },
  { name: "דאן 4", orderNumber: 31 },
  { name: "דאן 5", orderNumber: 32 },
  { name: "דאן 6", orderNumber: 33 },
  { name: "דאן 7", orderNumber: 34 },
  { name: "דאן 8", orderNumber: 35 },
];

function getOldToNewBeltMapping(): Record<string, string> {
  return {
    White: "קיו 1",
    Yellow: "קיו 2",
    Orange: "קיו 3",
    Green: "קיו 4",
    Blue: "קיו 5",
    Brown: "קיו 6",
    Black: "דאן 1",
  };
}

async function main() {
  console.log("Belt migration: preserving StudentBeltHistory...\n");

  const oldToNew = getOldToNewBeltMapping();

  const existingBelts = await prisma.beltLevel.findMany();
  const existingByName = new Map(existingBelts.map((b) => [b.name, b]));

  const historyCount = await prisma.studentBeltHistory.count();
  console.log(`Found ${historyCount} StudentBeltHistory records (will preserve).`);

  const history = await prisma.studentBeltHistory.findMany({
    include: { beltLevel: true },
  });

  for (const target of TARGET_BELT_LEVELS) {
    const existing = existingByName.get(target.name);
    if (existing) {
      if (existing.orderNumber !== target.orderNumber) {
        await prisma.beltLevel.update({
          where: { id: existing.id },
          data: { orderNumber: target.orderNumber },
        });
        console.log(`Updated order: ${target.name} -> ${target.orderNumber}`);
      }
    } else {
      await prisma.beltLevel.create({
        data: { name: target.name, orderNumber: target.orderNumber },
      });
      console.log(`Created: ${target.name}`);
    }
  }

  const newBeltsByName = new Map(
    (await prisma.beltLevel.findMany()).map((b) => [b.name, b])
  );

  let remapped = 0;
  for (const h of history) {
    const oldName = h.beltLevel.name;
    const newName = oldToNew[oldName] ?? oldName;
    const newBelt = newBeltsByName.get(newName);

    if (newBelt && newBelt.id !== h.beltLevelId) {
      await prisma.studentBeltHistory.update({
        where: { id: h.id },
        data: { beltLevelId: newBelt.id },
      });
      remapped++;
    }
  }

  if (remapped > 0) {
    console.log(
      `\nRemapped ${remapped} StudentBeltHistory records to new belt levels.`
    );
  }

  const orphanBelts = existingBelts.filter(
    (b) => !TARGET_BELT_LEVELS.some((t) => t.name === b.name)
  );

  for (const old of orphanBelts) {
    const refCount = await prisma.studentBeltHistory.count({
      where: { beltLevelId: old.id },
    });
    if (refCount === 0) {
      await prisma.beltLevel.delete({ where: { id: old.id } });
      console.log(`Removed orphan belt: ${old.name}`);
    } else {
      console.log(
        `Kept orphan belt "${old.name}" (${refCount} history records still reference it)`
      );
    }
  }

  console.log("\nMigration complete. StudentBeltHistory preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
