"use server";

import type { TrainingDay } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import {
  fetchGroupRecordForDetail,
  fetchGroupEditBundle,
} from "@/lib/server/group-record";

type ScheduleSlot = {
  trainingDay: TrainingDay;
  startTime: string;
  endTime: string;
};

export type GroupModalPayload = {
  group: {
    id: string;
    name: string;
    centerName: string;
    instructorName: string;
    notes: string | null;
    studentsCount: number;
    scheduleSummary: { day: string; time: string }[];
  };
  edit: {
    group: {
      id: string;
      name: string;
      centerId: string;
      instructorId: string;
      notes: string;
      schedules: ScheduleSlot[];
    };
    centers: { id: string; name: string }[];
    instructors: { id: string; name: string }[];
  };
};

export async function getGroupForModal(
  groupId: string
): Promise<
  { ok: true; data: GroupModalPayload } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "לא מחובר" };

  const detail = await fetchGroupRecordForDetail(groupId);
  if (!detail) return { ok: false, error: "קבוצה לא נמצאה" };

  const editBundle = await fetchGroupEditBundle(groupId);
  if (!editBundle) return { ok: false, error: "קבוצה לא נמצאה" };

  const { group, studentsCount, scheduleSummary } = detail;

  return {
    ok: true,
    data: {
      group: {
        id: group.id,
        name: group.name,
        centerName: group.center.name,
        instructorName: `${group.instructor.firstName} ${group.instructor.lastName}`,
        notes: group.notes,
        studentsCount,
        scheduleSummary,
      },
      edit: {
        group: {
          id: editBundle.group.id,
          name: editBundle.group.name,
          centerId: editBundle.group.centerId,
          instructorId: editBundle.group.instructorId,
          notes: editBundle.group.notes ?? "",
          schedules: editBundle.initialSchedules,
        },
        centers: editBundle.centers,
        instructors: editBundle.instructors,
      },
    },
  };
}
