import type { CurrentUser } from "@/lib/auth";
import type { PaymentsPageQueryScope } from "@/types/payments-page";

export function getPaymentsPageScope(user: CurrentUser): PaymentsPageQueryScope {
  return {
    role: user.role,
    instructorId: user.instructorId,
  };
}
