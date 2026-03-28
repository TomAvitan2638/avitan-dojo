import type { CurrentUser } from "@/lib/auth";
import type { StudentsPageQueryScope } from "@/types/students-page";

/** Pure scope for React Query keys — matches API / Prisma list filtering. */
export function getStudentsPageScope(user: CurrentUser): StudentsPageQueryScope {
  return {
    role: user.role,
    instructorId: user.instructorId,
  };
}
