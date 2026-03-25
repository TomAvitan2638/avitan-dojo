import type { SupabaseClient } from "@supabase/supabase-js";

export type MfaFlowPath = "/dashboard" | "/mfa-verify" | "/mfa-setup";

/**
 * Single source of truth for post-login MFA routing (server-side).
 * - AAL2 → dashboard
 * - Verified TOTP exists but session not AAL2 → mfa-verify
 * - Otherwise → mfa-setup (first enrollment or completing unverified factor)
 */
export async function resolveMfaFlowPath(
  supabase: SupabaseClient
): Promise<MfaFlowPath | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel === "aal2") {
    return "/dashboard";
  }

  const { data: factors, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return "/mfa-setup";
  }

  if (factors?.totp?.length) {
    return "/mfa-verify";
  }

  return "/mfa-setup";
}
