import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resolveMfaFlowPath } from "@/lib/mfa-flow";

/** Dashboard: must be signed in at AAL2; else same routing as post-login. */
export async function requireMfaSession() {
  const supabase = createClient();
  const path = await resolveMfaFlowPath(supabase);

  if (!path) {
    redirect("/login");
  }

  if (path !== "/dashboard") {
    redirect(path);
  }
}

/** MFA verify: signed in, not AAL2, and at least one verified TOTP factor. */
export async function requireMfaVerifyPageAccess() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel === "aal2") {
    redirect("/dashboard");
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();

  if (!factors?.totp?.length) {
    redirect("/mfa-setup");
  }
}

/**
 * MFA setup: signed in, not AAL2, no verified TOTP yet
 * (unverified factor or none — enrollment happens on the client).
 */
export async function requireMfaSetupPageAccess() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel === "aal2") {
    redirect("/dashboard");
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();

  if (factors?.totp?.length) {
    redirect("/mfa-verify");
  }
}
