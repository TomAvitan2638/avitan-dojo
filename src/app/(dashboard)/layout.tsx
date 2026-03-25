import { requireMfaSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMfaSession();

  return <DashboardShell>{children}</DashboardShell>;
}
