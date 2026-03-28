"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  fetchCenterRecordForDetail,
  fetchInstructorsForCenterSelect,
} from "@/lib/server/center-record";

export type CenterModalPayload = {
  center: {
    id: string;
    name: string;
    instructorName: string | null;
    instructorId: string | null;
    price: number | null;
    notes: string | null;
  };
  groups: { id: string; name: string }[];
  edit: {
    center: {
      id: string;
      name: string;
      instructorId: string;
      price: string;
      notes: string;
    };
    instructors: { id: string; name: string }[];
  };
};

export async function getCenterForModal(
  centerId: string
): Promise<
  { ok: true; data: CenterModalPayload } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "לא מחובר" };

  const center = await fetchCenterRecordForDetail(centerId);
  if (!center) return { ok: false, error: "מרכז לא נמצא" };

  const instructors = await fetchInstructorsForCenterSelect();

  const instructorName = center.instructor
    ? `${center.instructor.firstName} ${center.instructor.lastName}`
    : null;

  return {
    ok: true,
    data: {
      center: {
        id: center.id,
        name: center.name,
        instructorName,
        instructorId: center.instructorId,
        price: center.price ? Number(center.price) : null,
        notes: center.notes,
      },
      groups: center.groups.map((g) => ({ id: g.id, name: g.name })),
      edit: {
        center: {
          id: center.id,
          name: center.name,
          instructorId: center.instructorId ?? "",
          price: center.price ? String(center.price) : "",
          notes: center.notes ?? "",
        },
        instructors,
      },
    },
  };
}
