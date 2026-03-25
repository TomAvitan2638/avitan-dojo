import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CenterDetailsClient } from "./center-details-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CenterDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const center = await prisma.center.findUnique({
    where: { id },
    include: {
      instructor: true,
      groups: true,
    },
  });

  if (!center) redirect("/dashboard/centers");

  const instructorName = center.instructor
    ? `${center.instructor.firstName} ${center.instructor.lastName}`
    : null;

  return (
    <div className="min-h-screen">
      <Header
        title={center.name}
        backHref="/dashboard/centers"
        backLabel="חזרה למרכזים"
      />
      <div className="p-6">
        <CenterDetailsClient
          center={{
            id: center.id,
            name: center.name,
            instructorName,
            instructorId: center.instructorId,
            price: center.price ? Number(center.price) : null,
            notes: center.notes,
          }}
          groups={center.groups.map((g) => ({
            id: g.id,
            name: g.name,
          }))}
        />
      </div>
    </div>
  );
}
