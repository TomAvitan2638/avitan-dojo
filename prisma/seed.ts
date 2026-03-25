import { PrismaClient } from "@prisma/client";
import {
  addDays,
  subDays,
  subMonths,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";

const prisma = new PrismaClient();

const BELT_LEVELS = [
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

function time(hours: number, minutes: number): Date {
  return setMinutes(setHours(new Date(2000, 0, 1), hours), minutes);
}

async function main() {
  // Belt levels
  const existingBelts = await prisma.beltLevel.count();
  if (existingBelts === 0) {
    for (const belt of BELT_LEVELS) {
      await prisma.beltLevel.create({
        data: { name: belt.name, orderNumber: belt.orderNumber },
      });
    }
    console.log(`Seeded ${BELT_LEVELS.length} belt levels.`);
  }

  // Skip demo data if already seeded
  const existingStudents = await prisma.student.count();
  if (existingStudents > 0) {
    console.log("Demo data already exists, skipping.");
    return;
  }

  const today = startOfDay(new Date());
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Instructors
  const instructor1 = await prisma.instructor.create({
    data: {
      firstName: "יוסי",
      lastName: "כהן",
      birthDate: new Date(1985, 2, 15),
      phone: "050-1234567",
      email: "yossi@avitan-dojo.co.il",
      city: "חיפה",
      notes: "מאמן ראשי, דאן 5",
    },
  });

  const instructor2 = await prisma.instructor.create({
    data: {
      firstName: "מיכל",
      lastName: "לוי",
      birthDate: new Date(1990, 7, 22),
      phone: "052-9876543",
      email: "michal@avitan-dojo.co.il",
      city: "חיפה",
      notes: "מאמנת קבוצות ילדים",
    },
  });

  const instructor3 = await prisma.instructor.create({
    data: {
      firstName: "דוד",
      lastName: "אברהם",
      birthDate: new Date(1978, 11, 8),
      phone: "054-5551234",
      email: "david@avitan-dojo.co.il",
      city: "קריית מוצקין",
      notes: "מאמן קבוצות מבוגרים",
    },
  });

  console.log("Seeded 3 instructors.");

  // Centers
  const center1 = await prisma.center.create({
    data: {
      name: "מכון אביטן - חיפה",
      instructorId: instructor1.id,
      price: 350,
      notes: "המכון הראשי",
    },
  });

  const center2 = await prisma.center.create({
    data: {
      name: "מכון אביטן - קריית מוצקין",
      instructorId: instructor3.id,
      price: 320,
      notes: "סניף צפון",
    },
  });

  console.log("Seeded 2 centers.");

  // Groups
  const groupKidsA = await prisma.group.create({
    data: {
      name: "ילדים א'",
      centerId: center1.id,
      instructorId: instructor2.id,
      genderRestriction: null,
      notes: "גילאי 6-9",
    },
  });

  const groupKidsB = await prisma.group.create({
    data: {
      name: "ילדים ב'",
      centerId: center1.id,
      instructorId: instructor2.id,
      genderRestriction: null,
      notes: "גילאי 10-12",
    },
  });

  const groupTeens = await prisma.group.create({
    data: {
      name: "נוער",
      centerId: center1.id,
      instructorId: instructor1.id,
      genderRestriction: null,
      notes: "גילאי 13-17",
    },
  });

  const groupAdults = await prisma.group.create({
    data: {
      name: "מבוגרים",
      centerId: center1.id,
      instructorId: instructor1.id,
      genderRestriction: null,
      notes: "מעל גיל 18",
    },
  });

  const groupAdultsKiryat = await prisma.group.create({
    data: {
      name: "מבוגרים קריית מוצקין",
      centerId: center2.id,
      instructorId: instructor3.id,
      genderRestriction: null,
      notes: "קבוצת ערב",
    },
  });

  console.log("Seeded 5 groups.");

  // Group schedules
  const scheduleData = [
    { groupId: groupKidsA.id, day: "MONDAY" as const, start: time(16, 0), end: time(17, 0) },
    { groupId: groupKidsA.id, day: "WEDNESDAY" as const, start: time(16, 0), end: time(17, 0) },
    { groupId: groupKidsB.id, day: "TUESDAY" as const, start: time(17, 0), end: time(18, 0) },
    { groupId: groupKidsB.id, day: "THURSDAY" as const, start: time(17, 0), end: time(18, 0) },
    { groupId: groupTeens.id, day: "MONDAY" as const, start: time(18, 0), end: time(19, 30) },
    { groupId: groupTeens.id, day: "WEDNESDAY" as const, start: time(18, 0), end: time(19, 30) },
    { groupId: groupAdults.id, day: "SUNDAY" as const, start: time(19, 0), end: time(20, 30) },
    { groupId: groupAdults.id, day: "TUESDAY" as const, start: time(19, 0), end: time(20, 30) },
    { groupId: groupAdults.id, day: "THURSDAY" as const, start: time(19, 0), end: time(20, 30) },
    { groupId: groupAdultsKiryat.id, day: "MONDAY" as const, start: time(20, 0), end: time(21, 30) },
    { groupId: groupAdultsKiryat.id, day: "WEDNESDAY" as const, start: time(20, 0), end: time(21, 30) },
  ];

  for (const s of scheduleData) {
    await prisma.groupSchedule.create({
      data: {
        groupId: s.groupId,
        trainingDay: s.day,
        startTime: s.start,
        endTime: s.end,
      },
    });
  }

  console.log("Seeded group schedules.");

  // Students - include 3 with birthday today
  const kyu1Belt = await prisma.beltLevel.findFirst({
    where: { name: "קיו 1" },
  });
  const kyu2Belt = await prisma.beltLevel.findFirst({
    where: { name: "קיו 2" },
  });
  const kyu3Belt = await prisma.beltLevel.findFirst({
    where: { name: "קיו 3" },
  });

  const studentsData = [
    { identifier: "123456789", firstName: "דניאל", lastName: "כהן", birthYear: 2012, birthMonth: todayMonth, birthDay: todayDay, city: "חיפה" },
    { identifier: "234567890", firstName: "מיכל", lastName: "לוי", birthYear: 2009, birthMonth: todayMonth, birthDay: todayDay, city: "חיפה" },
    { identifier: "345678901", firstName: "יוסי", lastName: "אברהם", birthYear: 1995, birthMonth: todayMonth, birthDay: todayDay, city: "קריית מוצקין" },
    { identifier: "456789012", firstName: "שרה", lastName: "גולן", birthYear: 2015, birthMonth: 5, birthDay: 12, city: "חיפה" },
    { identifier: "567890123", firstName: "רון", lastName: "מזרחי", birthYear: 2011, birthMonth: 8, birthDay: 3, city: "חיפה" },
    { identifier: "678901234", firstName: "אבי", lastName: "ישראלי", birthYear: 1988, birthMonth: 1, birthDay: 15, city: "קריית מוצקין" },
    { identifier: "789012345", firstName: "נועה", lastName: "בן דוד", birthYear: 2013, birthMonth: 11, birthDay: 22, city: "חיפה" },
    { identifier: "890123456", firstName: "עמית", lastName: "שמעון", birthYear: 2010, birthMonth: 4, birthDay: 7, city: "חיפה" },
    { identifier: "901234567", firstName: "תמר", lastName: "דהן", birthYear: 2014, birthMonth: 9, birthDay: 18, city: "חיפה" },
    { identifier: "012345678", firstName: "אורי", lastName: "פלד", birthYear: 2008, birthMonth: 2, birthDay: 28, city: "קריית מוצקין" },
    { identifier: "112233445", firstName: "ליאור", lastName: "בר", birthYear: 1985, birthMonth: 7, birthDay: 5, city: "חיפה" },
    { identifier: "223344556", firstName: "מאיה", lastName: "חזן", birthYear: 2012, birthMonth: 12, birthDay: 1, city: "חיפה" },
    { identifier: "334455667", firstName: "איתי", lastName: "גבע", birthYear: 2007, birthMonth: 3, birthDay: 14, city: "חיפה" },
    { identifier: "445566778", firstName: "יעל", lastName: "רוזן", birthYear: 1992, birthMonth: 6, birthDay: 25, city: "קריית מוצקין" },
    { identifier: "556677889", firstName: "איתן", lastName: "שחר", birthYear: 2011, birthMonth: 10, birthDay: 9, city: "חיפה" },
  ];

  const students: { id: string }[] = [];
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: {
        identifier: s.identifier,
        firstName: s.firstName,
        lastName: s.lastName,
        birthDate: new Date(s.birthYear, s.birthMonth - 1, s.birthDay),
        gender: Math.random() > 0.5 ? "זכר" : "נקבה",
        city: s.city,
        status: "active",
      },
    });
    students.push(student);
  }

  console.log(`Seeded ${students.length} students.`);

  // Memberships with some overdue (payment_due_date in past)
  const membershipData = [
    { studentIdx: 0, group: groupKidsA, paymentDue: subDays(today, 13), hasPayment: false },
    { studentIdx: 1, group: groupTeens, paymentDue: subDays(today, 9), hasPayment: false },
    { studentIdx: 2, group: groupAdultsKiryat, paymentDue: subDays(today, 4), hasPayment: false },
    { studentIdx: 3, group: groupKidsA, paymentDue: addDays(today, 15), hasPayment: true },
    { studentIdx: 4, group: groupKidsB, paymentDue: subDays(today, 2), hasPayment: false },
    { studentIdx: 5, group: groupAdults, paymentDue: subDays(today, 20), hasPayment: false },
    { studentIdx: 6, group: groupKidsA, paymentDue: addDays(today, 20), hasPayment: true },
    { studentIdx: 7, group: groupKidsB, paymentDue: addDays(today, 5), hasPayment: true },
    { studentIdx: 8, group: groupKidsA, paymentDue: addDays(today, 10), hasPayment: true },
    { studentIdx: 9, group: groupTeens, paymentDue: addDays(today, 12), hasPayment: true },
    { studentIdx: 10, group: groupAdults, paymentDue: addDays(today, 3), hasPayment: true },
    { studentIdx: 11, group: groupKidsB, paymentDue: subDays(today, 7), hasPayment: false },
    { studentIdx: 12, group: groupTeens, paymentDue: addDays(today, 8), hasPayment: true },
    { studentIdx: 13, group: groupAdultsKiryat, paymentDue: addDays(today, 25), hasPayment: true },
    { studentIdx: 14, group: groupKidsB, paymentDue: addDays(today, 1), hasPayment: true },
  ];

  const memberships: { id: string; studentId: string }[] = [];
  for (const m of membershipData) {
    const student = students[m.studentIdx];
    const startDate = subMonths(today, 3);
    const endDate: Date | null = null;
    const membership = await prisma.studentMembership.create({
      data: {
        studentId: student.id,
        groupId: m.group.id,
        startDate,
        endDate,
        status: "active",
        paymentDueDate: m.paymentDue,
      },
    });
    memberships.push({ ...membership, studentId: student.id });

    if (m.hasPayment) {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          membershipId: membership.id,
          paymentDate: subDays(today, 30),
          amount: 350,
          paymentMethod: "credit_card",
        },
      });
    }
  }

  console.log(`Seeded ${memberships.length} memberships.`);

  // Additional payments for overdue memberships (partial history)
  const overdueMemberships = membershipData
    .map((m, i) => ({ ...m, idx: i }))
    .filter((m) => !m.hasPayment && m.paymentDue < today);

  for (const m of overdueMemberships.slice(0, 2)) {
    const membership = memberships[m.idx];
    await prisma.payment.create({
      data: {
        studentId: membership.studentId,
        membershipId: membership.id,
        paymentDate: subDays(today, 60),
        amount: 350,
        paymentMethod: "cash",
      },
    });
  }

  const paymentCount = await prisma.payment.count();
  console.log(`Seeded ${paymentCount} payments.`);

  // Belt history for a few students
  if (kyu1Belt && kyu2Belt && kyu3Belt) {
    await prisma.studentBeltHistory.create({
      data: {
        studentId: students[0].id,
        beltLevelId: kyu2Belt.id,
        promotionDate: subMonths(today, 6),
      },
    });
    await prisma.studentBeltHistory.create({
      data: {
        studentId: students[1].id,
        beltLevelId: kyu3Belt.id,
        promotionDate: subMonths(today, 12),
      },
    });
    await prisma.studentBeltHistory.create({
      data: {
        studentId: students[10].id,
        beltLevelId: kyu3Belt.id,
        promotionDate: subMonths(today, 8),
      },
    });
    console.log("Seeded belt history.");
  }

  console.log("Demo data seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
