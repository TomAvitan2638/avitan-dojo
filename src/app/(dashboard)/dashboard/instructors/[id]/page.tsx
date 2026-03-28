import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";
import { fetchInstructorRecordForDetail } from "@/lib/server/instructor-record";
import { InstructorDetailsClient } from "./instructor-details-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InstructorDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const instructor = await fetchInstructorRecordForDetail(id);

  if (!instructor) redirect("/dashboard/instructors");

  const name = `${instructor.firstName} ${instructor.lastName}`;
  const birthDateStr = instructor.birthDate
    ? format(instructor.birthDate, "dd/MM/yyyy")
    : null;

  return (
    <div className="min-h-screen">
      <Header
        title={name}
        backHref="/dashboard/instructors"
        backLabel="חזרה למאמנים"
      />
      <div className="p-6">
        <InstructorDetailsClient
          instructor={{
            id: instructor.id,
            name,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            phone: instructor.phone,
            email: instructor.email,
            city: instructor.city,
            address: instructor.address,
            birthDate: birthDateStr,
            notes: instructor.notes,
            photoUrl: instructor.photoUrl,
            isActive: instructor.isActive,
          }}
          groups={instructor.groups.map((g) => ({
            id: g.id,
            name: g.name,
            centerName: g.center.name,
          }))}
          centers={instructor.centers.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
        />
      </div>
    </div>
  );
}
