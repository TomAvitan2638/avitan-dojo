import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { fetchGroupEditBundle } from "@/lib/server/group-record";
import { GroupEditForm } from "../group-edit-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const bundle = await fetchGroupEditBundle(id);

  if (!bundle) redirect("/dashboard/groups");

  const { group, centers, instructors, initialSchedules } = bundle;

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
          instructors={instructors}
        />
      </div>
    </div>
  );
}
