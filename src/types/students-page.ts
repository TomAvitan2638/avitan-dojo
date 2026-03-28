import type { StudentListRow } from "@/lib/student-list-filter";

export type StudentsPageQueryScope = {
  role: string;
  instructorId: string | null;
};

export type CenterOption = { id: string; name: string };
export type GroupOption = { id: string; name: string; centerId: string };
export type BeltOption = { id: string; name: string };

export type StudentsPagePayload = {
  students: StudentListRow[];
  centers: CenterOption[];
  groups: GroupOption[];
  beltLevels: BeltOption[];
  totalStudents: number;
};
