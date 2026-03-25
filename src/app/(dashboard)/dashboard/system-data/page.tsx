import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SystemDataPageClient } from "./system-data-page-client";

export const dynamic = "force-dynamic";

export default async function SystemDataPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [sportsEquipment, exams] = await Promise.all([
    prisma.sportsEquipment.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, description: true, amount: true },
    }),
    prisma.exam.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, description: true, amount: true },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header title="נתוני מערכת" />
      <div className="p-6">
        <SystemDataPageClient
          sportsEquipment={sportsEquipment.map((e) => ({
            ...e,
            amount: Number(e.amount),
          }))}
          exams={exams.map((e) => ({
            ...e,
            amount: Number(e.amount),
          }))}
        />
      </div>
    </div>
  );
}
