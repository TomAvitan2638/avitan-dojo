export type InstructorsPageQueryScope = {
  role: string;
  instructorId: string | null;
};

export type InstructorListRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  photoUrl: string | null;
  isActive: boolean;
  groupsCount: number;
};

export type InstructorsPagePayload = {
  instructors: InstructorListRow[];
};
