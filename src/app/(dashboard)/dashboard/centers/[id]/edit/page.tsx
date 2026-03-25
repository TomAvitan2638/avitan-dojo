import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CenterEditForm } from "../center-edit-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CenterEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const center = await prisma.center.findUnique({
    where: { id },
    include: { instructor: true },
  });

  if (!center) redirect("/dashboard/centers");

  const instructors = await prisma.instructor.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });

  const instructorsForSelect = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));

  return (
    <div className="min-h-screen">
      <Header
        title={`עריכת מרכז: ${center.name}`}
        backHref="/dashboard/centers"
        backLabel="חזרה למרכזים"
      />
      <div className="p-6">
        <CenterEditForm
          center={{
            id: center.id,
            name: center.name,
            instructorId: center.instructorId ?? "",
            price: center.price ? String(center.price) : "",
            notes: center.notes ?? "",
          }}
          instructors={instructorsForSelect}
        />
      </div>
    </div>
  );
}
