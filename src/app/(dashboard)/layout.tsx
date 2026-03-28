import { requireMfaSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QueryProvider } from "@/components/providers/query-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMfaSession();

  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
