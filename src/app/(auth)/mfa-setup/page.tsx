import { requireMfaSetupPageAccess } from "@/lib/auth-guard";
import { MfaSetupForm } from "./mfa-setup-form";

export default async function MfaSetupPage() {
  await requireMfaSetupPageAccess();
  return <MfaSetupForm />;
}
