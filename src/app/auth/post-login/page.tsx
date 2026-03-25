import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveMfaFlowPath } from "@/lib/mfa-flow";

/**
 * Central post-password login router: dashboard | mfa-verify | mfa-setup.
 */
export default async function PostLoginPage() {
  const supabase = createClient();
  const path = await resolveMfaFlowPath(supabase);

  if (!path) {
    redirect("/login");
  }

  redirect(path);
}
