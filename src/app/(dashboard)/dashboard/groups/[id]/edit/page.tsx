import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GroupEditForm } from "../group-edit-form";
import { format } from "date-fns";
import type { TrainingDay } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: { schedules: { orderBy: { trainingDay: "asc" } } },
  });

  if (!group) redirect("/dashboard/groups");

  const [centers, instructors] = await Promise.all([
    prisma.center.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.instructor.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const instructorsForSelect = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));

  const initialSchedules =
    group.schedules.length > 0
      ? group.schedules.map((s) => ({
          trainingDay: s.trainingDay as TrainingDay,
          startTime: format(s.startTime, "HH:mm"),
          endTime: format(s.endTime, "HH:mm"),
        }))
      : [{ trainingDay: "SUNDAY" as TrainingDay, startTime: "16:00", endTime: "17:00" }];

  return (
    <div className="min-h-screen">
      <Header
        title={`עריכת קבוצה: ${group.name}`}
        backHref="/dashboard/groups"
        backLabel="חזרה לקבוצות"
      />
      <div className="p-6">
        <GroupEditForm
          group={{
            id: group.id,
            name: group.name,
            centerId: group.centerId,
            instructorId: group.instructorId,
            notes: group.notes ?? "",
            schedules: initialSchedules,
          }}
          centers={centers}
          instructors={instructorsForSelect}
        />
      </div>
    </div>
  );
}
