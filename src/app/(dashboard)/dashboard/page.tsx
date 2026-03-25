import { getCurrentUser } from "@/lib/auth";
import {
  getUpcomingBirthdays,
  getLatePayments,
} from "@/server/services/reminder-service";
import { getDashboardStats } from "@/server/services/dashboard-service";
import { Header } from "@/components/dashboard/header";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { BirthdaysWidget } from "@/components/dashboard/birthdays-widget";
import { OverduePaymentsWidget } from "@/components/dashboard/overdue-payments-widget";

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

  // Critical first (stats cards), then secondary widgets (max 2 connections during second batch)
  const stats = await getDashboardStats(user);
  const [birthdays, latePayments] = await Promise.all([
    getUpcomingBirthdays(user),
    getLatePayments(user),
  ]);

  return (
    <div className="min-h-screen">
      <Header title="דשבורד" />
      <div className="p-6">
        <DashboardHero />
        <StatsCards stats={stats} />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BirthdaysWidget birthdays={birthdays} />
          <OverduePaymentsWidget items={latePayments} />
        </div>
      </div>
    </div>
  );
}
