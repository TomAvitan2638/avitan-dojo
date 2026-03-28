"use server";

import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { fetchInstructorRecordForDetail } from "@/lib/server/instructor-record";

export type InstructorModalPayload = {
  instructor: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    address: string | null;
    birthDate: string | null;
    notes: string | null;
    photoUrl: string | null;
    isActive: boolean;
  };
  groups: { id: string; name: string; centerName: string }[];
  centers: { id: string; name: string }[];
  edit: {
    instructor: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      city: string;
      address: string;
      birthDate: string;
      notes: string;
      photoUrl: string;
      isActive: boolean;
    };
  };
};

export async function getInstructorForModal(
  instructorId: string
): Promise<
  { ok: true; data: InstructorModalPayload } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "לא מחובר" };

  const row = await fetchInstructorRecordForDetail(instructorId);
  if (!row) return { ok: false, error: "מאמן לא נמצא" };

  const name = `${row.firstName} ${row.lastName}`;
  const birthDateStr = row.birthDate
    ? format(row.birthDate, "dd/MM/yyyy")
    : null;

  const birthDateEdit = row.birthDate
    ? row.birthDate.toISOString().slice(0, 10)
    : "";

  return {
    ok: true,
    data: {
      instructor: {
        id: row.id,
        name,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        email: row.email,
        city: row.city,
        address: row.address,
        birthDate: birthDateStr,
        notes: row.notes,
        photoUrl: row.photoUrl,
        isActive: row.isActive,
      },
      groups: row.groups.map((g) => ({
        id: g.id,
        name: g.name,
        centerName: g.center.name,
      })),
      centers: row.centers.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      edit: {
        instructor: {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? "",
          email: row.email ?? "",
          city: row.city ?? "",
          address: row.address ?? "",
          birthDate: birthDateEdit,
          notes: row.notes ?? "",
          photoUrl: row.photoUrl ?? "",
          isActive: row.isActive,
        },
      },
    },
  };
}
