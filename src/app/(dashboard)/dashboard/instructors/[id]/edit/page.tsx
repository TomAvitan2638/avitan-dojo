import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InstructorEditForm } from "../instructor-edit-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InstructorEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const instructor = await prisma.instructor.findUnique({
    where: { id },
  });

  if (!instructor) redirect("/dashboard/instructors");

  const birthDateStr = instructor.birthDate
    ? instructor.birthDate.toISOString().slice(0, 10)
    : "";

  return (
    <div className="min-h-screen">
      <Header
        title={`עריכת מאמן: ${instructor.firstName} ${instructor.lastName}`}
        backHref="/dashboard/instructors"
        backLabel="חזרה למאמנים"
      />
      <div className="p-6">
        <InstructorEditForm
          instructor={{
            id: instructor.id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            phone: instructor.phone ?? "",
            email: instructor.email ?? "",
            city: instructor.city ?? "",
            address: instructor.address ?? "",
            birthDate: birthDateStr,
            notes: instructor.notes ?? "",
            photoUrl: instructor.photoUrl ?? "",
            isActive: instructor.isActive,
          }}
        />
      </div>
    </div>
  );
}
