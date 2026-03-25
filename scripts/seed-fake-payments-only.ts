/**
 * Seeds ONLY fake payments for the existing fake load dataset.
 * Uses students with identifiers 900000001–900000500.
 * Append-safe: creates only up to target (1700), stops when target reached.
 *
 * Run: npm run db:seed-fake-payments
 */

import { PrismaClient } from "@prisma/client";
import { subMonths, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const SEED = 42;
const IDENTIFIER_MIN = "900000001";
const IDENTIFIER_MAX = "900000500";
const TARGET_MONTHLY = 1000;
const TARGET_EQUIPMENT = 400;
const TARGET_EXAM = 300;
const TARGET_TOTAL = TARGET_MONTHLY + TARGET_EQUIPMENT + TARGET_EXAM;
const PAYMENT_BATCH = 25;
const TX_TIMEOUT_MS = 60_000;

const fakeStudentWhere = {
  identifier: { gte: IDENTIFIER_MIN, lte: IDENTIFIER_MAX } as const,
};

/** Deterministic PRNG (mulberry32) */
function createRng(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(SEED);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const PAYMENT_METHODS: ("cash" | "credit_card" | "check" | "bank_transfer" | "bit" | "paybox")[] = [
  "cash",
  "credit_card",
  "check",
  "bank_transfer",
  "bit",
  "paybox",
];
const MONTHLY_SUBTYPES: ("REGULAR" | "CHECK" | "WAIVER")[] = ["REGULAR", "CHECK", "WAIVER"];

async function main() {
  console.log("=== Avitan Dojo Fake Payments Only ===\n");
  console.log("WARNING: Intended for dev/test databases only.");

  const today = startOfDay(new Date());

  // --- Load fake students ---
  const students = await prisma.student.findMany({
    where: fakeStudentWhere,
    select: { id: true, identifier: true, firstName: true, lastName: true },
  });
  if (students.length === 0) {
    console.log("No fake students found (identifiers 900000001–900000500). Run db:seed-fake-load first.");
    process.exit(1);
  }
  console.log(`Found ${students.length} fake students.`);

  // --- Count existing fake payments by type ---
  const paymentWhere = { student: { identifier: { gte: IDENTIFIER_MIN, lte: IDENTIFIER_MAX } } };
  const [monthlyExisting, equipmentExisting, examExisting] = await Promise.all([
    prisma.payment.count({
      where: { ...paymentWhere, paymentType: "MONTHLY" },
    }),
    prisma.payment.count({
      where: { ...paymentWhere, paymentType: "EQUIPMENT" },
    }),
    prisma.payment.count({
      where: { ...paymentWhere, paymentType: "EXAM" },
    }),
  ]);

  const totalExisting = monthlyExisting + equipmentExisting + examExisting;
  const monthlyNeeded = Math.max(0, TARGET_MONTHLY - monthlyExisting);
  const equipmentNeeded = Math.max(0, TARGET_EQUIPMENT - equipmentExisting);
  const examNeeded = Math.max(0, TARGET_EXAM - examExisting);
  const totalNeeded = monthlyNeeded + equipmentNeeded + examNeeded;

  console.log(
    `Existing fake payments: ${totalExisting} (MONTHLY: ${monthlyExisting}, EQUIPMENT: ${equipmentExisting}, EXAM: ${examExisting})`
  );

  if (totalNeeded === 0) {
    console.log(`Target ${TARGET_TOTAL} already reached. Nothing to create.`);
    return;
  }
  console.log(`Creating ${totalNeeded} payments (MONTHLY: ${monthlyNeeded}, EQUIPMENT: ${equipmentNeeded}, EXAM: ${examNeeded}).`);

  // --- Load memberships (active, with group/center for snapshots) ---
  const memberships = await prisma.studentMembership.findMany({
    where: {
      student: { identifier: { gte: IDENTIFIER_MIN, lte: IDENTIFIER_MAX } },
      status: "active",
    },
    include: {
      group: { include: { center: true } },
    },
  });
  const studentById = new Map(students.map((s) => [s.id, s]));
  type MemWithSnapshots = {
    id: string;
    studentId: string;
    centerId: string;
    centerName: string;
    groupId: string;
    groupName: string;
  };
  const eligibleMonthlyMemberships: MemWithSnapshots[] = memberships.map((m) => ({
    id: m.id,
    studentId: m.studentId,
    centerId: m.group.center.id,
    centerName: m.group.center.name,
    groupId: m.group.id,
    groupName: m.group.name,
  }));

  if (monthlyNeeded > 0 && eligibleMonthlyMemberships.length === 0) {
    console.log("No active memberships for fake students. Skipping MONTHLY payments.");
  }

  // --- Load equipment and exam catalog ---
  const equipmentItems = (
    await prisma.sportsEquipment.findMany({
      where: { code: { startsWith: "LOAD-EQ-" } },
      select: { code: true, amount: true },
    })
  ).map((e) => ({ code: e.code, amount: Number(e.amount) }));
  const examItems = await prisma.exam.findMany({
    where: { code: { startsWith: "LOAD-EX-" } },
    select: { code: true },
  });

  if (equipmentNeeded > 0 && equipmentItems.length === 0) {
    console.log("No LOAD-EQ-* equipment found. Skipping EQUIPMENT payments.");
  }
  if (examNeeded > 0 && examItems.length === 0) {
    console.log("No LOAD-EX-* exams found. Skipping EXAM payments.");
  }

  let createdMonthly = 0;
  let createdEquipment = 0;
  let createdExam = 0;

  // --- Create MONTHLY payments ---
  if (monthlyNeeded > 0 && eligibleMonthlyMemberships.length > 0) {
    for (let i = 0; i < monthlyNeeded; i += PAYMENT_BATCH) {
      const batchSize = Math.min(PAYMENT_BATCH, monthlyNeeded - i);
      await prisma.$transaction(async (tx) => {
        for (let j = 0; j < batchSize; j++) {
          const mem = eligibleMonthlyMemberships[(i + j) % eligibleMonthlyMemberships.length];
          const subType = pick(MONTHLY_SUBTYPES) as "REGULAR" | "CHECK" | "WAIVER";
          const amount = subType === "WAIVER" ? 0 : 300 + Math.floor(rng() * 100);
          const paymentMethod =
            subType === "REGULAR" ? pick(PAYMENT_METHODS) : subType === "CHECK" ? ("check" as const) : null;
          const paymentDate = subMonths(today, Math.floor(rng() * 12));
          const monthsCount = 1 + Math.floor(rng() * 3);
          const months: { year: number; month: number }[] = [];
          for (let k = 0; k < monthsCount; k++) {
            const d = subMonths(paymentDate, k);
            months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
          }
          const student = studentById.get(mem.studentId);
          const payment = await tx.payment.create({
            data: {
              studentId: mem.studentId,
              membershipId: mem.id,
              paymentType: "MONTHLY",
              paymentDate,
              amount,
              paymentMethod,
              monthlySubtype: subType,
              bankNumber: subType === "CHECK" ? `12${String(i + j).padStart(4, "0")}` : null,
              checkNumber: subType === "CHECK" ? `${1000 + i + j}` : null,
              waiverReason: subType === "WAIVER" ? "Load test waiver" : null,
              studentIdentifierSnapshot: student?.identifier ?? mem.studentId,
              studentNameSnapshot: student ? `${student.firstName} ${student.lastName}` : "Load Test Student",
              centerIdSnapshot: mem.centerId,
              centerNameSnapshot: mem.centerName,
              groupIdSnapshot: mem.groupId,
              groupNameSnapshot: mem.groupName,
            },
          });
          await tx.paymentMonth.createMany({
            data: months.map((m) => ({
              paymentId: payment.id,
              year: m.year,
              month: m.month,
            })),
          });
        }
        },
        { timeout: TX_TIMEOUT_MS }
      );
      createdMonthly += batchSize;
      if ((i + batchSize) % 200 === 0 || i + batchSize >= monthlyNeeded) {
        console.log(`  MONTHLY: ${createdMonthly}/${monthlyNeeded}`);
      }
    }
    console.log(`Created ${createdMonthly} MONTHLY payments (with PaymentMonth).`);
  }

  // --- Create EQUIPMENT payments ---
  if (equipmentNeeded > 0 && equipmentItems.length > 0) {
    for (let i = 0; i < equipmentNeeded; i += PAYMENT_BATCH) {
      const batchSize = Math.min(PAYMENT_BATCH, equipmentNeeded - i);
      await prisma.$transaction(async (tx) => {
        for (let j = 0; j < batchSize; j++) {
          const student = students[(i + j) % students.length];
          const mem = eligibleMonthlyMemberships.find((m) => m.studentId === student.id);
          const itemsCount = 1 + Math.floor(rng() * 2);
          const chosen = shuffle(equipmentItems).slice(0, itemsCount);
          let amount = 0;
          const itemData = chosen.map((eq) => {
            const qty = 1 + Math.floor(rng() * 2);
            amount += eq.amount * qty;
            return {
              equipmentCode: eq.code,
              quantity: qty,
              unitAmountSnapshot: eq.amount,
            };
          });
          const paymentDate = subMonths(today, Math.floor(rng() * 12));
          const payment = await tx.payment.create({
            data: {
              studentId: student.id,
              membershipId: mem?.id ?? null,
              paymentType: "EQUIPMENT",
              paymentDate,
              amount,
              equipmentNotes: "Load test equipment",
              studentIdentifierSnapshot: student.identifier,
              studentNameSnapshot: `${student.firstName} ${student.lastName}`,
              centerIdSnapshot: mem?.centerId ?? null,
              centerNameSnapshot: mem?.centerName ?? null,
              groupIdSnapshot: mem?.groupId ?? null,
              groupNameSnapshot: mem?.groupName ?? null,
            },
          });
          await tx.paymentEquipmentItem.createMany({
            data: itemData.map((it) => ({
              paymentId: payment.id,
              equipmentCode: it.equipmentCode,
              quantity: it.quantity,
              unitAmountSnapshot: it.unitAmountSnapshot,
            })),
          });
        }
        },
        { timeout: TX_TIMEOUT_MS }
      );
      createdEquipment += batchSize;
      if ((i + batchSize) % 200 === 0 || i + batchSize >= equipmentNeeded) {
        console.log(`  EQUIPMENT: ${createdEquipment}/${equipmentNeeded}`);
      }
    }
    console.log(`Created ${createdEquipment} EQUIPMENT payments (with PaymentEquipmentItem).`);
  }

  // --- Create EXAM payments ---
  if (examNeeded > 0 && examItems.length > 0) {
    for (let i = 0; i < examNeeded; i += PAYMENT_BATCH) {
      const batchSize = Math.min(PAYMENT_BATCH, examNeeded - i);
      await prisma.$transaction(async (tx) => {
        for (let j = 0; j < batchSize; j++) {
          const student = students[(i + j) % students.length];
          const mem = eligibleMonthlyMemberships.find((m) => m.studentId === student.id);
          const exam = pick(examItems);
          const examDate = subMonths(today, Math.floor(rng() * 6));
          const amount = 100 + Math.floor(rng() * 100);
          const paymentDate = subMonths(today, Math.floor(rng() * 12));
          await tx.payment.create({
            data: {
              studentId: student.id,
              membershipId: mem?.id ?? null,
              paymentType: "EXAM",
              paymentDate,
              amount,
              examCode: exam.code,
              examDate,
              studentIdentifierSnapshot: student.identifier,
              studentNameSnapshot: `${student.firstName} ${student.lastName}`,
              centerIdSnapshot: mem?.centerId ?? null,
              centerNameSnapshot: mem?.centerName ?? null,
              groupIdSnapshot: mem?.groupId ?? null,
              groupNameSnapshot: mem?.groupName ?? null,
            },
          });
        }
        },
        { timeout: TX_TIMEOUT_MS }
      );
      createdExam += batchSize;
      if ((i + batchSize) % 200 === 0 || i + batchSize >= examNeeded) {
        console.log(`  EXAM: ${createdExam}/${examNeeded}`);
      }
    }
    console.log(`Created ${createdExam} EXAM payments.`);
  }

  const totalCreated = createdMonthly + createdEquipment + createdExam;
  console.log(`\n=== Done. Created ${totalCreated} fake payments. ===`);
  console.log(`Total fake payments now: ${totalExisting + totalCreated} (target: ${TARGET_TOTAL})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
