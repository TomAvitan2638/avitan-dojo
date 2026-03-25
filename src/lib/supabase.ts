import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role.
 * Use for Storage uploads and other server operations that bypass RLS.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "העלאת תמונות לא מוגדרת. הוסף NEXT_PUBLIC_SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY ל-.env"
    );
  }

  return createClient(url, key);
}
