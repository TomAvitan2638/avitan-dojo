import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InstructorsPageClient } from "./instructors-page-client";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const instructors = await prisma.instructor.findMany({
    include: {
      _count: { select: { groups: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const instructorsForList = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
    phone: i.phone ?? "-",
    email: i.email ?? "-",
    city: i.city ?? "-",
    photoUrl: i.photoUrl,
    isActive: i.isActive,
    groupsCount: i._count.groups,
  }));

  return (
    <div className="min-h-screen">
      <Header title="מאמנים" />
      <div className="p-6">
        <InstructorsPageClient instructors={instructorsForList} />
      </div>
    </div>
  );
}
