import "server-only";

import { format } from "date-fns";
import type { TrainingDay } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TRAINING_DAY_LABELS } from "@/lib/training-days";

/** Prisma fetch for group detail — same shape as `/dashboard/groups/[id]/page.tsx`. */
export async function fetchGroupRecordForDetail(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      center: true,
      instructor: true,
      schedules: { orderBy: { trainingDay: "asc" } },
    },
  });
  if (!group) return null;

  const studentsCount = await prisma.studentMembership.count({
    where: { groupId: id, status: "active" },
  });

  const scheduleSummary = group.schedules.map((s) => ({
    day: TRAINING_DAY_LABELS[s.trainingDay],
    time: `${format(s.startTime, "HH:mm")}-${format(s.endTime, "HH:mm")}`,
  }));

  return {
    group,
    studentsCount,
    scheduleSummary,
  };
}

/** Centers + instructors + group row for edit — same logic as `groups/[id]/edit/page.tsx`. */
export async function fetchGroupEditBundle(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { schedules: { orderBy: { trainingDay: "asc" } } },
  });
  if (!group) return null;

  const [centers, instructors] = await Promise.all([
    prisma.center.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.instructor.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const instructorsForSelect = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));

  const initialSchedules =
    group.schedules.length > 0
      ? group.schedules.map((s) => ({
          trainingDay: s.trainingDay as TrainingDay,
          startTime: format(s.startTime, "HH:mm"),
          endTime: format(s.endTime, "HH:mm"),
        }))
      : [{ trainingDay: "SUNDAY" as TrainingDay, startTime: "16:00", endTime: "17:00" }];

  return {
    group,
    centers,
    instructors: instructorsForSelect,
    initialSchedules,
  };
}
