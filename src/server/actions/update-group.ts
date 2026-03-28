"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { TrainingDay } from "@prisma/client";

export type UpdateGroupState = {
  error?: string;
  success?: boolean;
};

type ScheduleInput = {
  trainingDay: TrainingDay;
  startTime: string;
  endTime: string;
};

function parseScheduleJson(json: string): ScheduleInput[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (s): s is ScheduleInput =>
        s &&
        typeof s === "object" &&
        typeof s.trainingDay === "string" &&
        typeof s.startTime === "string" &&
        typeof s.endTime === "string"
    );
  } catch {
    return [];
  }
}

function timeFromHHmm(value: string): Date {
  const [h, m] = value.split(":").map(Number);
  return new Date(2000, 0, 1, h ?? 0, m ?? 0, 0, 0);
}

export async function updateGroup(
  groupId: string,
  _prevState: UpdateGroupState | null,
  formData: FormData
): Promise<UpdateGroupState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const name = (formData.get("name") as string)?.trim();
  const centerId = (formData.get("centerId") as string)?.trim();
  const instructorId = (formData.get("instructorId") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;
  const schedulesJson = (formData.get("schedules") as string)?.trim() || "[]";

  if (!name) return { error: "שם הקבוצה נדרש" };
  if (!centerId) return { error: "מרכז נדרש" };
  if (!instructorId) return { error: "מאמן נדרש" };

  const schedules = parseScheduleJson(schedulesJson);

  await prisma.$transaction([
    prisma.groupSchedule.deleteMany({ where: { groupId } }),
    prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        centerId,
        instructorId,
        notes,
        schedules: {
          create: schedules.map((s) => ({
            trainingDay: s.trainingDay as TrainingDay,
            startTime: timeFromHHmm(s.startTime),
            endTime: timeFromHHmm(s.endTime),
          })),
        },
      },
    }),
  ]);

  revalidatePath("/dashboard/groups");
  revalidatePath(`/dashboard/groups/${groupId}`);
  return { success: true };
}
