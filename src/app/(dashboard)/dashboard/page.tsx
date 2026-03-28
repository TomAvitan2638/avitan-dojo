import { getCurrentUser } from "@/lib/auth";
import { getDashboardPageScope } from "@/lib/dashboard-page-scope";
import { Header } from "@/components/dashboard/header";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardPageClient } from "./dashboard-page-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">יש להתחבר כדי לצפות בדשבורד.</p>
      </div>
    );
  }

  const queryScope = getDashboardPageScope(user);

  return (
    <div className="min-h-screen">
      <Header title="דשבורד" />
      <div className="p-6">
        <DashboardHero />
        <DashboardPageClient queryScope={queryScope} />
      </div>
    </div>
  );
}
