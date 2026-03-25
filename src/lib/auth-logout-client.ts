import { createClient } from "@/lib/supabase/client";
import { clearLoginTimestamp } from "@/lib/auth-local-storage";

/** Clears session timeout key, then Supabase sign-out. Does not touch `remembered_email`. */
export async function logoutFromApp(): Promise<void> {
  clearLoginTimestamp();
  const supabase = createClient();
  await supabase.auth.signOut();
}
