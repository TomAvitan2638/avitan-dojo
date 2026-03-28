import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { fetchGroupRecordForDetail } from "@/lib/server/group-record";
import { GroupDetailsClient } from "./group-details-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GroupDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const detail = await fetchGroupRecordForDetail(id);

  if (!detail) redirect("/dashboard/groups");

  const { group, studentsCount, scheduleSummary } = detail;

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
