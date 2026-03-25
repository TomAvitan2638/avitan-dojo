import { requireMfaVerifyPageAccess } from "@/lib/auth-guard";
import { MfaVerifyForm } from "./mfa-verify-form";

export default async function MfaVerifyPage() {
  await requireMfaVerifyPageAccess();
  return <MfaVerifyForm />;
}
