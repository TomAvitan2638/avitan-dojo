import type { CurrentUser } from "@/lib/auth";
import type { InstructorsPageQueryScope } from "@/types/instructors-page";

/** Pure scope for React Query keys — aligns with Students tab pattern. */
export function getInstructorsPageScope(
  user: CurrentUser
): InstructorsPageQueryScope {
  return {
    role: user.role,
    instructorId: user.instructorId,
  };
}
