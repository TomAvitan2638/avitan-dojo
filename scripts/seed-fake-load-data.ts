/**
 * Fake data generator for load/performance testing.
 * Append-only. Intended for dev/test databases only.
 *
 * Target: 500 students, 20 centers, 50 groups, 1700 payments.
 * Student identifiers: 900000001, 900000002, etc.
 *
 * Run: npm run db:seed-fake-load
 */

import { PrismaClient } from "@prisma/client";
import { addMonths, subMonths, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const SEED = 42;
const IDENTIFIER_BASE = 900000001;
const STUDENT_COUNT = 500;
const CENTER_COUNT = 20;
const GROUP_COUNT = 50;
const INSTRUCTOR_COUNT = 25;
const PAYMENT_COUNT = 1700;
const BATCH_SIZE = 100;

/** Deterministic PRNG (mulberry32) */
function createRng(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0; // mulberry32
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

const HEBREW_FIRST_NAMES = [
  "דניאל", "מיכל", "יוסי", "שרה", "רון", "אבי", "נועה", "עמית", "תמר", "אורי",
  "ליאור", "מאיה", "איתי", "יעל", "איתן", "נעה", "עידו", "מיקה", "אלעד", "שי",
  "גל", "נועם", "ליה", "יונתן", "שני", "דור", "רותם", "עמית", "מתן", "עדי",
];
const HEBREW_LAST_NAMES = [
  "כהן", "לוי", "אברהם", "גולן", "מזרחי", "ישראלי", "בן דוד", "שמעון", "דהן", "פלד",
  "בר", "חזן", "גבע", "רוזן", "שחר", "שוורץ", "קרוב", "אדלר", "וייס", "גולדברג",
];
const CITIES = ["חיפה", "קריית מוצקין", "נהריה", "עכו", "טירת כרמל", "יקנעם"];
const PAYMENT_METHODS: ("cash" | "credit_card" | "check" | "bank_transfer" | "bit" | "paybox")[] = [
  "cash",
  "credit_card",
  "check",
  "bank_transfer",
  "bit",
  "paybox",
];
const MONTHLY_SUBTYPES: ("REGULAR" | "CHECK" | "WAIVER")[] = ["REGULAR", "CHECK", "WAIVER"];

function time(hours: number, minutes: number): Date {
  return setMinutes(setHours(new Date(2000, 0, 1), hours), minutes);
}

async function main() {
  console.log("=== Avitan Dojo Fake Load Data Generator ===\n");
  console.log("WARNING: Intended for dev/test databases only.");

  // Guard: already seeded
  const existingFake = await prisma.student.findUnique({
    where: { identifier: String(IDENTIFIER_BASE) },
  });
  if (existingFake) {
    console.log("\nFake load data already exists (student 900000001 found). Exiting.");
    return;
  }

  const today = startOfDay(new Date());

  // --- Phase 1: Belt levels (skip if present) ---
  const beltCount = await prisma.beltLevel.count();
  if (beltCount === 0) {
    console.log("BeltLevel table empty. Run main seed first: npm run db:seed");
    process.exit(1);
  }
  const beltLevels = await prisma.beltLevel.findMany({ orderBy: { orderNumber: "asc" } });
  if (beltLevels.length === 0) {
    console.log("No belt levels found. Run main seed first.");
    process.exit(1);
  }
  console.log("Phase 1: BeltLevel OK");

  // --- Phase 2: SportsEquipment ---
  let equipmentItems: { id: string; code: string; amount: number }[];
  const existingLoadEq = await prisma.sportsEquipment.findMany({
    where: { code: { startsWith: "LOAD-EQ-" } },
  });
  if (existingLoadEq.length === 0) {
    const codes = Array.from({ length: 18 }, (_, i) => `LOAD-EQ-${String(i + 1).padStart(2, "0")}`);
    const items = codes.map((code, i) => ({
      code,
      description: `Load test equipment ${i + 1}`,
      amount: 50 + (i % 5) * 25,
    }));
    await prisma.sportsEquipment.createMany({ data: items });
    equipmentItems = (await prisma.sportsEquipment.findMany({ where: { code: { startsWith: "LOAD-EQ-" } } })).map(
      (e) => ({ id: e.id, code: e.code, amount: Number(e.amount) })
    );
    console.log(`Phase 2: Created ${equipmentItems.length} SportsEquipment`);
  } else {
    equipmentItems = existingLoadEq.map((e) => ({
      id: e.id,
      code: e.code,
      amount: Number(e.amount),
    }));
    console.log(`Phase 2: SportsEquipment OK (${equipmentItems.length} items)`);
  }

  // --- Phase 3: Exam ---
  let examItems: { id: string; code: string }[];
  const existingLoadEx = await prisma.exam.findMany({
    where: { code: { startsWith: "LOAD-EX-" } },
  });
  if (existingLoadEx.length === 0) {
    const codes = Array.from({ length: 10 }, (_, i) => `LOAD-EX-${String(i + 1).padStart(2, "0")}`);
    await prisma.exam.createMany({
      data: codes.map((code, i) => ({ code, description: `Load test exam ${i + 1}`, amount: 100 + i * 20 })),
    });
    examItems = (await prisma.exam.findMany({ where: { code: { startsWith: "LOAD-EX-" } } })).map((e) => ({
      id: e.id,
      code: e.code,
    }));
    console.log(`Phase 3: Created ${examItems.length} Exam`);
  } else {
    examItems = existingLoadEx.map((e) => ({ id: e.id, code: e.code }));
    console.log(`Phase 3: Exam OK (${examItems.length} items)`);
  }

  // --- Phase 4: Instructors ---
  const instructors: { id: string }[] = [];
  for (let i = 0; i < INSTRUCTOR_COUNT; i++) {
    const inst = await prisma.instructor.create({
      data: {
        firstName: pick(HEBREW_FIRST_NAMES),
        lastName: pick(HEBREW_LAST_NAMES),
        birthDate: new Date(1975 + (i % 25), i % 12, (i % 28) + 1),
        phone: `050-${String(1000000 + i).padStart(7, "0")}`,
        email: `load-instructor-${i + 1}@test.local`,
        city: pick(CITIES),
        notes: "Load test instructor",
      },
    });
    instructors.push(inst);
  }
  console.log(`Phase 4: Created ${instructors.length} Instructors`);

  // --- Phase 5: Centers ---
  const centers: { id: string; instructorId: string }[] = [];
  for (let i = 0; i < CENTER_COUNT; i++) {
    const inst = instructors[i % instructors.length];
    const center = await prisma.center.create({
      data: {
        name: `מכון בדיקה ${i + 1}`,
        instructorId: inst.id,
        price: 300 + (i % 5) * 25,
        notes: "Load test center",
      },
    });
    centers.push({ id: center.id, instructorId: inst.id });
  }
  console.log(`Phase 5: Created ${centers.length} Centers`);

  // --- Phase 6: Groups (2-3 per center) ---
  const groups: { id: string; centerId: string; instructorId: string; centerName: string; groupName: string }[] = [];
  let g = 0;
  for (let c = 0; c < CENTER_COUNT && g < GROUP_COUNT; c++) {
    const center = centers[c];
    const groupsPerCenter = c < 10 ? 3 : 2;
    for (let j = 0; j < groupsPerCenter && g < GROUP_COUNT; j++) {
      const inst = instructors[(c + j) % instructors.length];
      const group = await prisma.group.create({
        data: {
          name: `קבוצה ${g + 1} - מרכז ${c + 1}`,
          centerId: center.id,
          instructorId: inst.id,
          notes: "Load test group",
        },
      });
      groups.push({
        id: group.id,
        centerId: center.id,
        instructorId: inst.id,
        centerName: `מכון בדיקה ${c + 1}`,
        groupName: group.name,
      });
      g++;
    }
  }
  console.log(`Phase 6: Created ${groups.length} Groups`);

  // --- Phase 7: Group Schedules ---
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
  for (const group of groups) {
    const day = days[groups.indexOf(group) % days.length];
    await prisma.groupSchedule.create({
      data: {
        groupId: group.id,
        trainingDay: day,
        startTime: time(16 + (groups.indexOf(group) % 4), 0),
        endTime: time(17 + (groups.indexOf(group) % 4), 30),
      },
    });
  }
  console.log(`Phase 7: Created GroupSchedules for ${groups.length} groups`);

  // --- Phase 8: Students (batched) ---
  const students: { id: string; identifier: string; firstName: string; lastName: string }[] = [];
  for (let b = 0; b < STUDENT_COUNT; b += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, STUDENT_COUNT - b);
    const batch = Array.from({ length: batchSize }, (_, i) => {
      const idx = b + i;
      const year = 2000 + (idx % 15);
      const month = (idx % 12) + 1;
      const day = (idx % 28) + 1;
      return {
        identifier: String(IDENTIFIER_BASE + idx),
        studentNumber: IDENTIFIER_BASE + idx,
        firstName: pick(HEBREW_FIRST_NAMES),
        lastName: pick(HEBREW_LAST_NAMES),
        birthDate: new Date(year, month - 1, day),
        gender: rng() > 0.5 ? "זכר" : "נקבה",
        city: pick(CITIES),
        status: "active" as const,
      };
    });
    const created = await prisma.$transaction(
      batch.map((s) =>
        prisma.student.create({
          data: s,
          select: { id: true, identifier: true, firstName: true, lastName: true },
        })
      )
    );
    students.push(...created);
  }
  console.log(`Phase 8: Created ${students.length} Students`);

  // --- Phase 9: Memberships ---
  const studentIdsByGroup = new Map<string, string[]>();
  for (const g of groups) {
    studentIdsByGroup.set(g.id, []);
  }
  const shuffledStudents = shuffle(students);
  for (let i = 0; i < shuffledStudents.length; i++) {
    const student = shuffledStudents[i];
    const group = groups[i % groups.length];
    studentIdsByGroup.get(group.id)!.push(student.id);
  }

  const memberships: {
    id: string;
    studentId: string;
    groupId: string;
    groupName: string;
    centerName: string;
    centerId: string;
    status: "active" | "expired" | "cancelled";
  }[] = [];
  const studentById = new Map(students.map((s) => [s.id, s]));

  // Pre-build membership data
  type MemInput = {
    studentId: string;
    groupId: string;
    groupName: string;
    centerName: string;
    centerId: string;
    status: "active" | "expired" | "cancelled";
  };
  const memInputs: MemInput[] = [];
  for (const [groupId, stuIds] of studentIdsByGroup) {
    const group = groups.find((g) => g.id === groupId)!;
    for (const studentId of stuIds) {
      const status: "active" | "expired" | "cancelled" =
        rng() < 0.75 ? "active" : rng() < 0.5 ? "expired" : "cancelled";
      memInputs.push({
        studentId,
        groupId,
        groupName: group.groupName,
        centerName: group.centerName,
        centerId: group.centerId,
        status,
      });
    }
  }
  // Batch create memberships (50 per transaction)
  for (let b = 0; b < memInputs.length; b += BATCH_SIZE) {
    const batch = memInputs.slice(b, b + BATCH_SIZE);
    const created = await prisma.$transaction(
      batch.map((mi) => {
        const startDate = subMonths(today, 2 + Math.floor(rng() * 12));
        const endDate = mi.status === "active" ? null : subMonths(today, Math.floor(rng() * 6));
        return prisma.studentMembership.create({
          data: {
            studentId: mi.studentId,
            groupId: mi.groupId,
            startDate,
            endDate,
            status: mi.status,
            paymentDueDate: mi.status === "active" ? addMonths(today, 1) : null,
          },
        });
      })
    );
    for (let i = 0; i < batch.length; i++) {
      memberships.push({
        id: created[i].id,
        studentId: batch[i].studentId,
        groupId: batch[i].groupId,
        groupName: batch[i].groupName,
        centerName: batch[i].centerName,
        centerId: batch[i].centerId,
        status: batch[i].status,
      });
    }
  }
  // Add second membership for ~30% of students
  const activeMemberships = memberships.filter((m) => m.status === "active");
  const studentsWithMembership = new Set(activeMemberships.map((m) => m.studentId));
  const studentsNeedingSecond = shuffledStudents
    .filter((s) => studentsWithMembership.has(s.id))
    .slice(0, Math.floor(students.length * 0.3));
  for (const student of studentsNeedingSecond) {
    const currentGroupIds = new Set(
      memberships.filter((m) => m.studentId === student.id).map((m) => m.groupId)
    );
    const otherGroup = groups.find((g) => !currentGroupIds.has(g.id));
    if (otherGroup) {
      const m = await prisma.studentMembership.create({
        data: {
          studentId: student.id,
          groupId: otherGroup.id,
          startDate: subMonths(today, 1),
          endDate: null,
          status: "expired",
          paymentDueDate: null,
        },
      });
      memberships.push({
        id: m.id,
        studentId: student.id,
        groupId: otherGroup.id,
        groupName: otherGroup.groupName,
        centerName: otherGroup.centerName,
        centerId: otherGroup.centerId,
        status: "expired",
      });
    }
  }
  console.log(`Phase 9: Created ${memberships.length} Memberships`);

  // --- Phase 10: Belt history ---
  const beltHistoryCount = 250;
  const studentsForBelt = shuffle(students).slice(0, beltHistoryCount);
  for (let b = 0; b < beltHistoryCount; b += BATCH_SIZE) {
    const batch = studentsForBelt.slice(b, b + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((student, i) => {
        const belt = beltLevels[Math.min((b + i) % beltLevels.length, 10)];
        return prisma.studentBeltHistory.create({
          data: {
            studentId: student.id,
            beltLevelId: belt.id,
            promotionDate: subMonths(today, Math.floor(rng() * 24) + 1),
          },
        });
      })
    );
  }
  console.log(`Phase 10: Created ${beltHistoryCount} belt history records`);

  // --- Phase 11: Payments (with child rows) ---
  // Mix: ~1000 MONTHLY, ~400 EQUIPMENT, ~300 EXAM
  const monthlyCount = 1000;
  const equipmentCount = 400;
  const examCount = 300;

  const PAYMENT_BATCH = 50;

  // MONTHLY payments (need membershipId, PaymentMonth)
  const eligibleMonthlyMemberships = activeMemberships;
  for (let i = 0; i < monthlyCount; i += PAYMENT_BATCH) {
    const batchSize = Math.min(PAYMENT_BATCH, monthlyCount - i);
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
            studentIdentifierSnapshot: studentById.get(mem.studentId)?.identifier ?? mem.studentId,
            studentNameSnapshot: (() => {
              const s = studentById.get(mem.studentId);
              return s ? `${s.firstName} ${s.lastName}` : "Load Test Student";
            })(),
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
    });
  }
  console.log(`Phase 11a: Created ${monthlyCount} MONTHLY payments (with PaymentMonth)`);

  // EQUIPMENT payments (need PaymentEquipmentItem)
  for (let i = 0; i < equipmentCount; i += PAYMENT_BATCH) {
    const batchSize = Math.min(PAYMENT_BATCH, equipmentCount - i);
    await prisma.$transaction(async (tx) => {
      for (let j = 0; j < batchSize; j++) {
        const student = students[(i + j) % students.length];
        const mem = activeMemberships.find((m) => m.studentId === student.id);
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
    });
  }
  console.log(`Phase 11b: Created ${equipmentCount} EQUIPMENT payments (with PaymentEquipmentItem)`);

  // EXAM payments (standalone)
  for (let i = 0; i < examCount; i += PAYMENT_BATCH) {
    const batchSize = Math.min(PAYMENT_BATCH, examCount - i);
    await prisma.$transaction(async (tx) => {
      for (let j = 0; j < batchSize; j++) {
        const student = students[(i + j) % students.length];
        const mem = activeMemberships.find((m) => m.studentId === student.id);
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
    });
  }
  console.log(`Phase 11c: Created ${examCount} EXAM payments`);

  const totalPayments = monthlyCount + equipmentCount + examCount;
  console.log(`\n=== Fake load data complete ===`);
  console.log(`Students: ${students.length} (identifiers 900000001–900000500)`);
  console.log(`Centers: ${centers.length}, Groups: ${groups.length}, Instructors: ${instructors.length}`);
  console.log(`Memberships: ${memberships.length}, Belt history: ${beltHistoryCount}`);
  console.log(`Payments: ${totalPayments} (MONTHLY: ${monthlyCount}, EQUIPMENT: ${equipmentCount}, EXAM: ${examCount})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
