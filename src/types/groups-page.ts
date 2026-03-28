export type GroupsPageQueryScope = {
  role: string;
  instructorId: string | null;
};

export type GroupListRow = {
  id: string;
  name: string;
  centerName: string;
  instructorName: string;
  notes: string | null;
  studentsCount: number;
  boysCount: number;
  girlsCount: number;
  scheduleSummary: { day: string; time: string }[];
};

export type CenterOption = { id: string; name: string };
export type InstructorOption = { id: string; name: string };

export type GroupsPagePayload = {
  groups: GroupListRow[];
  centers: CenterOption[];
  instructors: InstructorOption[];
};
