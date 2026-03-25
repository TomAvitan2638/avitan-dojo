import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GroupDetailsClient } from "./group-details-client";
import { TRAINING_DAY_LABELS } from "@/lib/training-days";
import { format } from "date-fns";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      center: true,
      instructor: true,
      schedules: { orderBy: { trainingDay: "asc" } },
    },
  });

  if (!group) redirect("/dashboard/groups");

  const studentsCount = await prisma.studentMembership.count({
    where: { groupId: id, status: "active" },
  });

  const scheduleSummary = group.schedules.map((s) => ({
    day: TRAINING_DAY_LABELS[s.trainingDay],
    time: `${format(s.startTime, "HH:mm")}-${format(s.endTime, "HH:mm")}`,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title={group.name}
        backHref="/dashboard/groups"
        backLabel="חזרה לקבוצות"
      />
      <div className="p-6">
        <GroupDetailsClient
          group={{
            id: group.id,
            name: group.name,
            centerName: group.center.name,
            instructorName: `${group.instructor.firstName} ${group.instructor.lastName}`,
            notes: group.notes,
            studentsCount,
            scheduleSummary,
          }}
        />
      </div>
    </div>
  );
}
