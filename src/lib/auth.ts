import { createClient } from "@/lib/supabase/server";

export type UserRole = "ADMIN" | "INSTRUCTOR";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  instructorId: string | null;
};

/**
 * Returns the current user from the Supabase session (JWT + app_metadata).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const role = (user.app_metadata?.role as UserRole | undefined) ?? "ADMIN";
  const instructorId =
    (user.app_metadata?.instructor_id as string | undefined) ?? null;

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    instructorId,
  };
}
